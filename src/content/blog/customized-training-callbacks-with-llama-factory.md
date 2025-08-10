---
title: 在 LLaMA Factory 中使用自定义的 Training Callback 进行实验跟踪
description: 详细介绍如何在 LLaMA Factory 中基于 Transformers Trainer 实现自定义的 Training Callback，记录超参数、训练指标与GPU 使用情况，为 LLM 微调提供灵活的实验跟踪集成。
pubDate: 2025-08-01T21:24:46+08:00
categories:
  - LLM
tags:
  - LLM
  - Fine-Tuning
  - Python
---

随着 LLM 的快速发展，对模型进行微调已成为将通用模型适配到特定任务的关键技术。在微调过程中，实验跟踪和监控至关重要，它不仅帮助研究者追踪训练进度、分析模型性能，还能为后续的模型优化和参数调整提供重要依据。

本文将详细介绍如何利用 Transformers 库的 Training Callback 机制，在流行的微调框架 LLaMA Factory 中实现自定义的实验跟踪功能，使用户能够根据自身需求灵活地记录训练指标、系统资源使用情况和模型配置信息，为 LLM 微调提供完整的实验跟踪集成。

## 背景

### Transformers

Transformers 是 Hugging Face 的 Python 开源库，其支持多种深度学习框架，并提供了统一的 API 设计来进行模型训练与推理。
Transformers 基本上成为了 LLM 领域的事实标准库，几乎所有的 LLM 的微调框架都是基于 Transformers 实现的，包括本文使用的 LLaMA Factory 与 Hugging Face 自身的 [TRL](https://github.com/huggingface/trl) 等。

#### Training Callback

Callback 是 Transformers 中用于在 Trainer 的训练过程中执行特定操作的机制。它们允许用户在训练的不同阶段插入自定义逻辑，例如记录指标或保存模型状态等，也可以根据自身需求来控制训练流程（如 [Early stopping](https://huggingface.co/docs/transformers/main_classes/callback#transformers.EarlyStoppingCallback)）。

```python
trainer = Trainer(...)
trainer.add_callback(MyCallback)
```

Transformers 中的 `src/transformers/trainer_callback.py` 与 `src/transformers/integrations/integration_utils.py` 都提供了许多可以供参考的 Trainer Callback 的示例，用户只需要继承 `TrainerCallback` 类并实现相关的方法并将其添加到 Trainer 中的 Callback 即可，Trainer 会根据加入 Callback 的顺序在特定步骤时依次调用。

#### Trainer

本节将简要介绍 Transformers 中的 Trainer 的工作流程，下文的伪代码简要描述了部分关键的训练流程。
Transformers 的 Trainer 的训练流程集成了前文所提及的 Training Callback 机制，由配置的处理以及相关组件的初始化开始，随后进入主要的训练流程（`on_train_begin`）。
在训练过程中会循环迭代每个 epoch（`on_epoch_begin`），并计算出需要的更新步数（基于 dataloader 的数量或是指定的 `max_steps`，以及梯度累积步数 `gradient_accumulation_steps`）并进入更新步数的循环。
在每个更新步数中（`on_step_begin`），Trainer 会执行前向与反向传播计算损失，并进行梯度裁剪（如果需要的话），然后在实际参数更新的时候触发与 Optimizer 相关的回调（`on_pre_optimizer_step` 和 `on_optimizer_step`）。
根据梯度累积的设置，Trainer 会在每个梯度累积步数结束时（`on_step_end`）或是每个更新步数结束时（`on_substep_end`），根据回调设置的控制标志进行日志记录、保存模型或评估等操作。

```python title="src/transformers/trainer.py"
def _inner_training_loop(...):
    setup_and_initialize()

    # Running training loop
    control = on_train_begin(...) # [!code highlight]

    for epoch in range(epochs_trained, num_train_epochs):
        control = on_epoch_begin(...) # [!code highlight]

        for update_step in range(total_updates):
            for i, inputs in enumerate(batch_samples):
                # For gradient accumulation boundaries
                if step % gradient_accumulation_steps == 0:
                    control = on_step_begin(...) # [!code highlight]

                # Forward and backward pass
                loss = training_step(model, inputs, num_items_in_batch)

                # Sync gradients
                if do_sync_step:
                    # Gradient clipping
                    if max_grad_norm > 0:
                        gradient_clipping(...)

                    # Pre-optimizer step hook
                    control = on_pre_optimizer_step(...) # [!code highlight]

                    # Optimizer step
                    optimizer.step()

                    # Post-optimizer step hook
                    control = on_optimizer_step(...) # [!code highlight]

                    # update learning rate
                    lr_scheduler.step()

                    # Post-step hook
                    control = on_step_end(...) # [!code highlight]

                    _maybe_log_save_evaluate(...)
                else:
                    # For gradient accumulation
                    control = on_substep_end(...) # [!code highlight]

                if control.should_training_stop or control.should_epoch_stop:
                    break

            # Break out of the nested loop
            if control.should_training_stop or control.should_epoch_stop:
                break

        if step < 0:
            control.should_training_stop = True

        control = on_epoch_end(...) # [!code highlight]

        _maybe_log_save_evaluate(...)

        if control.should_training_stop:
            break

    control = on_train_end(...) # [!code highlight]

    # Training completed

    return TrainOutput(global_step, train_loss, metrics)


def _maybe_log_save_evaluate(...):
    if control.should_log:
        # log()
        control = on_log(...) # [!code highlight]

    if control.should_evaluate:
        # evaluate()
        control = on_evaluate(...) # [!code highlight]

    if control.should_save:
        _save_checkpoint(...)

        control = on_save(...) # [!code highlight]
```

### LLaMA Factory

LLaMA Factory 是一个基于 Transformers 的微调框架，旨在简化 LLM 的训练和微调过程。它提供了易用的 UI 界面和灵活的 Python API，使得用户可以快速上手并进行自定义的训练任务，很好地平衡了专业使用者和非专业使用者的需求。

以在 LLaMA Factory 中运行 SFT 为例，具体的工作流如下：

1. 读取 Tokenizer、数据集与模型
2. Data Collation，SFT 中的 `SFTDataCollatorWith4DAttentionMask` 继承了 Transformers 的 `DataCollatorForSeq2Seq`
3. 初始化 Trainer，SFT 中的 `CustomSeq2SeqTrainer` 继承了 Transformers 的 `Seq2SeqTrainer`
4. 训练
   - 如果 `do_train` 为 True，进行训练（`trainer.train`）并保存模型
   - 如果 `do_eval` 为 True，基于评测数据集进行评估（`trainer.evaluate`）
   - 如果 `do_predict` 为 True，则进行预测（`trainer.predict`）
5. 生成 Model Card 并推送模型

基于前文所提及的 Transformers 的 Training Callback，我们可以通过实现自定义的 Training Callback 来介入 Trainer 训练的流程。

## 实现自定义的 Training Callback

```python title="src/tracker/integrations/transformers.py"
class CustomTrackerCallback(TrainerCallback):
    def __init__(self):
        super().__init__()
        self.tracker = CustomTracker()

    @override
    def on_train_begin(self, args, state, control, model=None, **kwargs):
        pass

    @override
    def on_train_end(self, args, state, control, **kwargs):
        pass

    @override
    def on_log(self, args, state, control, logs=None, model=None, **kwargs):
        pass
```

为了实现自定义的实验跟踪，我们需要关注在以下几个方法：

- `on_train_begin()`：初始化实验记录，并记录相关的超参数。
- `on_train_end()`：结束当前的实验记录，并上传实验小结。
- `on_log()`：记录训练过程中的指标以及系统指标。

需要注意的是，由于 LLaMA Factory 的 SFT 的 Workflow 在训练结束之后会根据 `do_eval` 与 `do_predict` 参数决定是否进行评估和预测，并将其结果通过 `log_metrics` 记录，即会再次调用 `on_log()` Callback。因此根据实验跟踪的实现，需要针对其进行额外的处理（如可能不能在 `on_train_end()` 的时候结束实验）。

### 记录超参数

在 `on_train_begin()` 方法中，我们可以初始化 Tracker 的实例（`args.run_name`）并通过 `args` 与 `model.config` 和 `model.peft_config` 等参数获取并记录相关的超参数与模型设置。

### 记录训练指标

Transformers 在训练过程中使用 `_maybe_log_save_evaluate()` 函数来根据传入的参数判断是否要记录训练指标，或是保存模型和进行评估。

默认情况下，在 `on_log()` 回调函数中的 `logs` 参数会包含以下几个指标：

- `loss`：损失 `round(self._nested_gather(tr_loss).mean().item() / (self.state.global_step - self._globalstep_last_logged), 4)`
- `grad_norm`：梯度范数 `self.accelerator.clip_grad_norm_(...)`
- `learning_rate`：学习率 `self.lr_scheduler.get_last_lr()[0]`
- `epoch`：当前 Epoch `self.state.epoch`
- `step`：当前步数 `self.state.global_step`
- `num_input_tokens_seen`（if `args.include_num_input_tokens_seen`）: 当前输入的 Token 数量 `self.state.num_input_tokens_seen`

因此，我们可以根据 `state` 或是 `logs` 中的指标来记录相关的训练指标。

### 记录 GPU 指标

基于 `pynvml`，我们可以便利地获取 GPU 的相关指标。如果使用的是非 NVIDIA 的 GPU 的话，还需要根据具体的型号来实现不同的指标获取方式。

- `memory_allocated`: 当前分配的 GPU 内存
- `memory_reserved`: 当前保留的 GPU 内存
- `memory_active`: 当前活跃的 GPU 内存

```python
device_idx = torch.cuda.current_device()

total_memory = torch.cuda.get_device_properties(device_idx).total_memory
memory_allocated = torch.cuda.memory_allocated(device_idx)
memory_reserved = torch.cuda.memory_reserved(device_idx)
memory_active = torch.cuda.memory_stats(device_idx).get(
    "active_bytes.all.peak", 0
)

gpu_memory_logs = {
    f"gpu.{device_idx}.memory.allocated": memory_allocated / total_memory * 100,
    f"gpu.{device_idx}.memory.reserved": memory_reserved / total_memory * 100,
    f"gpu.{device_idx}.memory.active": memory_active / total_memory * 100,
}
```

当然，我们也可以选择另外启动一个轻量级的进程去记录相关的系统指标而不需要耦合在 Callback 的逻辑中（如 `wandb` 与 `mlflow`）。

## 在 LLaMA Factory 中使用自定义的 Training Callback

目前 LLaMa Factory 的微调入口都是直接调用了 `llamafactory.train.tuner.run_exp` 函数，但是实际上 `run_exp(args: Optional[dict[str, Any]] = None, callbacks: Optional[list["TrainerCallback"]] = None) -> None` 函数是可以接受 `callbacks` 参数的，因此用户可以通过传入自定义的 Callback 来实现实验跟踪。

```python title="src/tracker/cli.py"
from llamafactory.train.tuner import run_exp

from tracker.integrations.transformers import (
    CustomTrackerCallback,
)


def main():
    run_exp(callbacks=[CustomTrackerCallback()])


if __name__ == "__main__":
    main()
```

用户可以简单地初始化 `CustomTrackerCallback` 的实例并将其传递给 `run_exp` 函数。

```bash
python -m tracker.cli <args>

## distributed training
torchrun -m tracker.cli <args>
```

随后就可以使用 `python -m tracker.cli` 或 `torchrun -m tracker.cli` 替换掉原先的 `llamafactory-cli train` 命令来运行微调任务。

## 结语

在本文中，我们详细介绍了如何在 LLaMA Factory 中使用自定义的 Training Callback 进行实验跟踪。
基于实现自定义的 Callback，并通过实现训练过程中的相关回调函数，我们可以灵活地记录训练过程中相关指标，包括超参数、训练指标和系统资源使用情况等。
此外，我们还介绍了如何在 LLaMA Factory 中集成前述的自定义 Trainer Callback，并通过简单的 CLI 命令来运行微调任务。

## 参考

- [Callbacks](https://huggingface.co/docs/transformers/main/en/main_classes/callback)

## 附录：在其它微调相关框架中进行自定义的实验跟踪

在附录中，本文会简要介绍一些在其它微调相关框架中进行自定义的实验跟踪的方式。

### `transformers`

与本文所介绍的 LLaMA Factory 相同，基于 `transformers` 的微调框架都可以通过实现自定义的 Training Callback 的方式来进行实验跟踪。

可参考 [Callbacks](https://huggingface.co/docs/transformers/main/en/main_classes/callback) 文档获取更多示例。

### `accelerate`

Accelerate 是 Hugging Face 提供的一个用于简化 PyTorch 分布式训练的库。

```python title="src/accelerate/tracking.py"
class GeneralTracker:
    """
    A base Tracker class to be used for all logging integration implementations.

    Each function should take in `**kwargs` that will automatically be passed in from a base dictionary provided to
    [`Accelerator`].

    Should implement `name`, `requires_logging_directory`, and `tracker` properties such that:

    `name` (`str`): String representation of the tracker class name, such as "TensorBoard" `requires_logging_directory`
    (`bool`): Whether the logger requires a directory to store their logs. `tracker` (`object`): Should return internal
    tracking mechanism used by a tracker class (such as the `run` for wandb)

    Implementations can also include a `main_process_only` (`bool`) attribute to toggle if relevent logging, init, and
    other functions should occur on the main process or across all processes (by default will use `True`)
    """

    main_process_only = True

    def __init__(self, _blank=False):
        if not _blank:
            err = ""
            if not hasattr(self, "name"):
                err += "`name`"
            if not hasattr(self, "requires_logging_directory"):
                if len(err) > 0:
                    err += ", "
                err += "`requires_logging_directory`"

            # as tracker is a @property that relies on post-init
            if "tracker" not in dir(self):
                if len(err) > 0:
                    err += ", "
                err += "`tracker`"
            if len(err) > 0:
                raise NotImplementedError(
                    f"The implementation for this tracker class is missing the following "
                    f"required attributes. Please define them in the class definition: "
                    f"{err}"
                )

    def start(self):
        """
        Lazy initialization of the tracker inside Accelerator to avoid initializing PartialState before
        InitProcessGroupKwargs.
        """
        pass

    def store_init_configuration(self, values: dict):
        """
        Logs `values` as hyperparameters for the run. Implementations should use the experiment configuration
        functionality of a tracking API.

        Args:
            values (Dictionary `str` to `bool`, `str`, `float` or `int`):
                Values to be stored as initial hyperparameters as key-value pairs. The values need to have type `bool`,
                `str`, `float`, `int`, or `None`.
        """
        pass

    def log(self, values: dict, step: Optional[int], **kwargs):
        """
        Logs `values` to the current run. Base `log` implementations of a tracking API should go in here, along with
        special behavior for the `step parameter.

        Args:
            values (Dictionary `str` to `str`, `float`, or `int`):
                Values to be logged as key-value pairs. The values need to have type `str`, `float`, or `int`.
            step (`int`, *optional*):
                The run step. If included, the log will be affiliated with this step.
        """
        pass

    def finish(self):
        """
        Should run any finalizing functions within the tracking API. If the API should not have one, just don't
        overwrite that method.
        """
        pass
```

Accelerate 提供了一个通用的 Tracker 类 `GeneralTracker`，用户可以通过继承该类来实现自定义的 Tracker。

```python
from accelerate import Accelerator
from tracker.integrations.accelerate import CustomTracker

tracker = CustomTracker(run_name="test_run")
accelerator = Accelerator(log_with=tracker)
```

可参考 [Experiment trackers](https://huggingface.co/docs/accelerate/usage_guides/tracking) 文档获取更多示例。

### `trl`

[TRL](https://github.com/huggingface/trl) 是 Hugging Face 开源一个用于进行包括 SFT、DPO、GRPO 等在内后训练的基于 Transformers 的 LLM 微调框架。

在 TRL 中，基于 `transformers` 的 Trainer（如 [SFT](https://huggingface.co/docs/trl/sft_trainer)、[DPO](https://huggingface.co/docs/trl/dpo_trainer) 与 [GRPO](https://huggingface.co/docs/trl/grpo_trainer) 等）都可以使用实现自定义的 Training Callback 的方式来进行实验跟踪，而针对 Stable Diffusion 的 Trainer（如 [DDPO](https://huggingface.co/docs/trl/ddpo_trainer) 与 [AlignProp](https://huggingface.co/docs/trl/alignprop_trainer)），可以使用 `accelerate` 的自定义 Tracker 的方式来记录实验。

```python title="src/trl/trainer.py"
from tracker.integrations.transformers import (
    CustomTrackerCallback,
)
from trl import SFTTrainer

trainer = SFTTrainer(
    ...
    callbacks=[CustomTrackerCallback()],
)

trainer.train()
```

可参考 Transformers 的 [Callbacks](https://huggingface.co/docs/transformers/main/en/main_classes/callback) 或 Accelerate 的 [Experiment trackers](https://huggingface.co/docs/accelerate/usage_guides/tracking) 文档获取更多示例。

### `deepspeed`

DeepSpeed 是微软开发的一个开源深度学习优化库，专门用于加速大规模分布式深度学习训练。

```python title="deepspeed/monitor/monitor.py"
class Monitor(ABC):

    @abstractmethod
    def __init__(self, monitor_config):
        self.monitor_config = monitor_config

    @abstractmethod
    def write_events(self, event_list):
        pass
```

不过目前 DeepSpeed 并没有提供 Out-of-tree 的方式来实现自定义的 Monitor。

### `torchtune`

`torchtune` 是 PyTorch 社区所开源的 LLM 微调框架，旨在简化和优化 LLM 的训练和微调过程，并作为 PyTorch 原生的生态系统的一部分，可以与 PyTorch 生态系统的其它组件进行集成。

```python
class MetricLoggerInterface(Protocol):
    """Abstract metric logger."""

    def log(
        self,
        name: str,
        data: Scalar,
        step: int,
    ) -> None:
        """Log scalar data.

        Args:
            name (str): tag name used to group scalars
            data (Scalar): scalar data to log
            step (int): step value to record
        """
        pass

    def log_config(self, config: DictConfig) -> None:
        """Logs the config as file

        Args:
            config (DictConfig): config to log
        """
        pass

    def log_dict(self, payload: Mapping[str, Scalar], step: int) -> None:
        """Log multiple scalar values.

        Args:
            payload (Mapping[str, Scalar]): dictionary of tag name and scalar value
            step (int): step value to record
        """
        pass

    def close(self) -> None:
        """
        Close log resource, flushing if necessary.
        Logs should not be written after `close` is called.
        """
        pass
```

```python
class CustomTrackerLogger(MetricLoggerInterface):
    pass
```

```bash
tune run lora_finetune_single_device \
    --config llama3/8B_lora_single_device \
    <args> \
    metric_logger._component_=custom_module.CustomTrackerLogger \
    <custom-tracker-args>
```

用户在创建微调任务的时候可以通过 `metric_logger._component_` 参数来指定自定义的 MetricLogger，同时还支持使用 `metric_logger.<custom-args>` 来传递相关的参数。

可参考 [Logging to Weights & Biases](https://docs.pytorch.org/torchtune/stable/deep_dives/wandb_logging.html) 文档获取更多示例。
