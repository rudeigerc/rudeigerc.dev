---
title: Structuring a Python Project with PDM
description: This tutorial shows you how to structure a Python project with PDM, a modern Python package and dependency manager supporting the latest PEP standards.
pubDate: 2023-11-12T22:16:39+08:00
categories:
- tutorial
- python
tags:
- python
- pdm
series:
- tutorial
---

This tutorial shows you how to structure a Python project with [PDM](https://pdm-project.org/latest/), a modern Python package and dependency manager supporting the latest PEP standards.

## Background

**PDM** is a modern Python package and dependency manager supporting the latest PEP standards, including [PEP 621](https://peps.python.org/pep-0621/) project metadata and a [PEP 517](https://peps.python.org/pep-0517/) build backend. PDM simplifies the process od depenedency management and lifecycle management of Python projects.

**Alternatives:**

- [python-poetry/poetry](https://github.com/python-poetry/poetry)
- [pypa/hatch](https://github.com/pypa/hatch)
- [mitsuhiko/rye](https://github.com/mitsuhiko/rye)

## Objectives

This tutorial covers the following steps:

1. [Initialize a new project](#initialize-a-new-project)
2. [Configure development environment](#configure-development-environment)
3. [Manage development dependencies](#manage-development-dependencies)
4. [Build and Publish](#build-and-publish)

## Prerequisites

- Python 3.7+
- PDM

### Install PDM

#### Install PDM with `pipx`

`pipx` is a tool to install and run applications in isolated virtual environments. It is remommended to install Python application in an isolated environemnt to acoid potential dependency conflicts.

Install `pipx` and ensure directories necessary for `pipx` operation are in `PATH` environment variable:

```shell
python -m pip install --user pipx
python -m pipx ensurepath
```

Install `pdm` with `pipx`:

```shell
pipx install pdm[all]
```

#### Install PDM with `pip`

You can still install `pdm` with `pip` normally:

```shell
pip install --user pdm
```

### (Optional) Enable central installation caches of PDM

Similar to `pnpm`, `pdm` also supports [central installation caches](https://pdm-project.org/latest/usage/config/#central-installation-caches) to avoid waste of disc space.

Enable the central installation caches of PDM:

```shell
pdm config install.cache on
```

## Initialize a new project

Create a new project with `pdm init`:

```shell
mkdir my-project && cd my-project
pdm init
```

The outcome is similar to the following:

```shell
Creating a pyproject.toml for PDM...
Please enter the Python interpreter to use
0. /usr/local/bin/python (3.11)
1. /usr/local/bin/python3.12 (3.12)
2. /usr/local/bin/python3.11 (3.11)
3. /usr/local/bin/python3.10 (3.10)
Please select (0):
Would you like to create a virtualenv with /usr/local/bin/python? [y/n] (y):
Virtualenv is created successfully at /Users/rudeigerc/Developer/my-project/.venv
Is the project a library that is installable?
If yes, we will need to ask a few more questions to include the project name and build backend [y/n] (n): y
Project name (my-project):
Project version (0.1.0):
Project description ():
Which build backend to use?
0. pdm-backend
1. setuptools
2. flit-core
3. hatchling
Please select (0):
License(SPDX name) (MIT):
Author name (rudeigerc):
Author email (rudeigerc@gmail.com):
Python requires('*' to allow any) (>=3.11):
Project is initialized successfully
```

**Make sure that you have selected the proper Python interpreter.**

### Work with virtual environment

PDM will ask whether to use virtual environment when initializing a new project. It is recommended to use virtual environment to isolate the project from the global environment.

Actiavte the virtual environment in the project:

```shell
eval $(pdm venv activate)
```

Please refer to the [documentation](https://pdm-project.org/latest/usage/venv/) to learn more about how to manage virtual environments with PDM.

## Configure the project

### (Optional) Configure package indexes

To overcome the network issues, you can configure package indexes to use mirrors of PyPI.

Add `tuna` and `sjtug` as package indexes in `pyproject.toml`:

```toml
[[tool.pdm.source]]
url = "https://pypi.tuna.tsinghua.edu.cn/simple"
name = "tuna"

[[tool.pdm.source]]
url = "https://mirror.sjtu.edu.cn/pypi/web/simple"
name = "sjtug"
```

You can choose to ignore the stored package indexes and use the aforementioned package indexes only defined in `pyproject.toml`:

```shell
pdm config --local pypi.ignore_stored_index true
```

### Configure development environment

#### Configure Visual Studio Code

Here are some recommended extensions for Visual Studio Code:

```json
{
  "recommendations": [
    "charliermarsh.ruff",
    "editorconfig.editorconfig",
    "ms-python.mypy-type-checker",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "njpwerner.autodocstring",
    "redhat.vscode-yaml",
    "tamasfe.even-better-toml",
  ]
}
```

You can define recommended extensions in workspace scope in `.vscode/extensions.json`

##### Configure Python language support

Configure Python language support in `.vscode/settings.json`:

```json
{
  "python.analysis.autoImportCompletions": true,
  "python.analysis.extraPaths": [
    ".venv/lib/python3.11/site-packages"
  ],
  "python.analysis.fixAll": [
    "source.unusedImports"
  ],
  "python.languageServer": "Pylance",
}
```

Note that `extraPaths` should match the path based on the interpeter version of Python in your virtual environment.

#### (Optional) Configure `.editorconfig`

[EditorConfig](https://editorconfig.org/) is a tool that helps developers define and maintain consistent coding styles between different editors and IDEs.

Here is an example of `.editorconfig` for Python projects:

```ini
root = true

[*]
charset = utf-8
trim_trailing_whitespace = true
end_of_line = lf
indent_style = space
insert_final_newline = true
indent_size = 2

[*.py]
indent_size = 4

[pyproject.toml]
indent_size = 4
```

### Manage development dependencies

In this section, the tutorial will cover the following topics:

- Linting and formatting
- Testing
- Documentation

#### Linting and formatting

##### Configure `ruff`

`ruff` is an extremely fast Python linter and code formatter, written in Rust.

Since v0.1.2, `ruff` supports both *linting* and *formatting* with outstanding performance compared to existing tools. As a result, `ruff` is recommended as the default linter and formatter for Python projects in this tutorial.

Add `ruff` as a development dependency in group `lint`:

```shell
pdm add -dG lint ruff
```

Configure `ruff` in `pyproject.toml`:

```toml
[tool.ruff]
select = [
    "B", # flake8-bugbear
    "C4", # flake8-comprehensions
    "E", # pycodestyle - Error
    "F", # Pyflakes
    "I", # isort
    "W", # pycodestyle - Warning
    "UP", # pyupgrade
]
ignore = [
    "E501", # line-too-long
    "W191", # tab-indentation
]
include = ["**/*.py", "**/*.pyi", "**/pyproject.toml"]

[tool.ruff.pydocstyle]
convention = "google"
```

Configure `ruff` in `.vscode/settings.json`:

```json
{
  "[python]": {
    "editor.codeActionsOnSave": {
      "source.fixAll": true,
      "source.organizeImports": true
    },
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.rulers": [
      88
    ]
  },
}
```

Please refer to the [documentation of `ruff`](https://docs.astral.sh/ruff) for more details about configuration.

**Alternatives:**

- Linter
  - [PyCQA/flake8](https://github.com/PyCQA/flake8)
  - [pylint-dev/pylint](https://github.com/pylint-dev/pylint)
- Formatter
  - [psf/black](https://github.com/psf/black)
    - [google/pyink](https://github.com/google/pyink)
  - [google/yapf](https://github.com/google/yapf)
  - [hhatto/autopep8](https://github.com/hhatto/autopep8)

##### Configure `mypy`

`mypy` is an optional static type checker for Python.

```shell
pdm add -dG lint mypy
```

Configure `mypy` in `pyproject.toml`:

```toml
[tool.mypy]
strict = true
```

> If you run mypy with the --strict flag, you will basically never get a type related error at runtime without a corresponding mypy error, unless you explicitly circumvent mypy somehow.
>
> However, this flag will probably be too aggressive if you are trying to add static types to a large, existing codebase. See [Using mypy with an existing codebase](https://mypy.readthedocs.io/en/stable/existing_code.html#existing-code) for suggestions on how to handle that case.

Configure `mypy` in `.vscode/settings.json`:

```json
{
  "mypy-type-checker.path": [
    ".venv/bin/mypy"
  ],
}
```

Please refer to the [documentation of `mypy`](https://mypy.readthedocs.io/en/stable/config_file.html) for more details about configuration.

**Alternatives:**

- [microsoft/pyright](https://github.com/microsoft/pyright)
- [google/pytype](https://github.com/google/pytype)
- [facebook/pyre-check](https://github.com/facebook/pyre-check)

##### Configure PDM scripts

PDM supports running scripts or commands with local packages loaded, similar to `npm`.

```toml
[tool.pdm.scripts]
lint = "ruff ."
fmt = "ruff format ."
```

Please refer to the [documentaion of PDM scripts](https://pdm-project.org/latest/usage/scripts/) for more details.

##### (Optional) Configure `pre-commit`

[`pre-commit`](https://pre-commit.com/) is a framework for managing and maintaining multi-language pre-commit hooks.

Add `pre-commit` as a development dependency in group `lint`:

```shell
pdm add -dG lint pre-commit
```

Add a pre-commit configuration file `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-yaml
        args:
          - --unsafe
      - id: end-of-file-fixer
      - id: trailing-whitespace
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.2
    hooks:
      - id: ruff
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.6.1
    hooks:
      - id: mypy
        language: system
```

Install the Git hook scripts:

```shell
pdm run pre-commit install
```

`pre-commit` will be triggered automatically before each commit.

Besides, you can also modify the aforementioned `pdm.scripts` section in `pyproject.toml`:

```diff
[tool.pdm.scripts]
- lint = "ruff ."
- fmt = "ruff format ."
+ lint = "pre-commit run --all-files"
```

Now you can run `pdm run lint` to lint the project manually.

#### Testing

##### Configure `pytest`

Pytest is a testing framework for Python.

Add `pytest` and `pytest-cov` as development dependencies in group `test`:

```shell
pdm add -dG pytest pytest-cov
```

Configure testing support in `.vscode/settings.json`:

```json
{
  "python.testing.pytestArgs": [
    "tests"
  ],
  "python.testing.pytestEnabled": true,
  "python.testing.pytestPath": ".venv/bin/pytest",
  "python.testing.unittestEnabled": false,
}
```

With the configuration above, you can run tests with the built-in test runner of Visual Studio Code.

**Alternatives:**

- unittest

#### (Optional) Documentation

[MkDocs](https://www.mkdocs.org/) is a static site generator for project documentation, and [mkdocs-material](https://squidfunk.github.io/mkdocs-material/) is a powerful documentation framework on top of MkDocs.

Add `mkdocs` and `mkdocs-material` as development dependencies in group `docs`:

```shell
pdm add -dG docs mkdocs mkdocs-material
```

Configure YAML schema validation in `.vscode/settings.json` as mentioned in the [documentation](https://squidfunk.github.io/mkdocs-material/creating-your-site/#minimal-configuration):

```json
{
  "yaml.schemas": {
    "https://squidfunk.github.io/mkdocs-material/schema.json": "mkdocs.yml"
  },
  "yaml.customTags": [
    "!ENV scalar",
    "!ENV sequence",
    "tag:yaml.org,2002:python/name:material.extensions.emoji.to_svg",
    "tag:yaml.org,2002:python/name:material.extensions.emoji.twemoji",
    "tag:yaml.org,2002:python/name:pymdownx.superfences.fence_code_format"
  ]
}
```

Initialize a new documentation:

```shell
pdm run mkdocs new .
```

This will create the following structure:

```shell
├─ docs/
│  └─ index.md
└─ mkdocs.yml
```

Enable `mkdocs-material` in `mkdocs.yml`:

```yaml
theme:
  name: material
```

Add a script to run `mkdocs` in `pyproject.toml`:

```toml
[tool.pdm.scripts]
docs = "mkdocs serve"
```

Start the development server:

```shell
pdm run docs
```

The detailed configuration of `mkdocs` and `mkdocs-material` is out of the scope of this tutorial. Please refer to the [documentation](https://squidfunk.github.io/mkdocs-material/getting-started/) for more details.

**Alternatives:**

- [sphinx-doc/sphinx](https://github.com/sphinx-doc/sphinx)
  - [pradyunsg/furo](https://github.com/pradyunsg/furo)
  - [lepture/shibuya](https://github.com/lepture/shibuya)
- [facebook/docusaurus](https://github.com/facebook/docusaurus)
- [vuejs/vitepress](https://github.com/vuejs/vitepress)

## Build and Publish

After configuring the project and finishing coding and testing, you can build and publish the project to [PYPI](https://pypi.org/).

PDM also provides a [PEP 517](https://peps.python.org/pep-0517/) build [backend](https://backend.pdm-project.org/).

```toml
[build-system]
requires = ["pdm-backend"]
build-backend = "pdm.backend"
```

### Configure project metadata

[PEP 621](https://www.python.org/dev/peps/pep-0621/) is a standard for Python project metadata.

Define project metadata in `pyproject.toml`:

```toml
[project]
name = "my-project"
version = "0.1.0"
description = ""
authors = [{name = "rudeigerc", email="rudeigerc@gmail.com"}]
dependencies = []
requires-python = ">=3.11"
readme = "README.md"
license = {text = "MIT"}
```

#### Package version

PDM backend supports dynamic project version.

Remove the `version` field and import `version` in the `dynamic` field in `pyproject.toml`:

```diff
[project]
- version = "0.1.0"
+ dynamic = ["version"]
```

##### From a given file path

```toml
[tool.pdm.version]
source = "file"
path = "src/my-package/__init__.py"
```

The file `src/my-package/__init__.py` should contain a `__version__` variable:

```python
__version__ = "0.1.0"
```

##### From SCM tag

```toml
[tool.pdm.version]
source = "scm"
```

Tag current commit with version `v0.0.1`:

```shell
git tag v0.0.1
```

Check the artifacts with `pdm build`:

```shell
pdm build
```

### Configure PYPI

To upload your package to PYPI, you need to create an account on [PYPI](https://pypi.org/) and generate an API token in `Account settings > API Tokens > Add API Token`.

With your username and the generated token, configure PYPI remote repository in `pyproject.toml`:

```shell
pdm config repository.pypi.url https://pypi.org/simple
pdm config repository.pypi.username <username>
pdm config repository.pypi.password <api-token>
```

Check the configuration of repository `pypi`:

```shell
pdm config
```

The outcome is similar to the following:

```shell
Home configuration (config.toml):
repository.pypi.url = "https://pypi.org/simple"
repository.pypi.username = <username>
repository.pypi.password = <api-token>
```

Build and publish the project to PYPI:

```shell
pdm publish -r pypi
```

Note that for **test** purpose, you should publish the project to [Test PYPI](https://test.pypi.org/):

```shell
pdm config repository.testpypi.url https://test.pypi.org/simple
pdm config repository.testpypi.username <username>
pdm config repository.testpypi.password <api-token>
```

```shell
pdm publish -r testpypi
```

Please refer the documenation of [PDM Backend](https://backend.pdm-project.org/metadata/) and [Python Package User Guide](https://packaging.python.org/en/latest/tutorials/packaging-projects/) for more details about publishing Python packages.

## Clean up

### Delete the project

```shell
cd .. && rm -rf my-project
```

## Appendix

### Libraries

- [ruff](https://github.com/astral-sh/ruff) - An extremely fast Python linter and code formatter, written in Rust.
- [mypy](https://github.com/python/mypy) - Optional static typing for Python
- [mkdocs](https://github.com/mkdocs/mkdocs) - Project documentation with Markdown.
- [mkdocs-material](https://github.com/squidfunk/mkdocs-material) - Documentation that simply works
- [pytest](https://github.com/pytest-dev/pytest) - The pytest framework makes it easy to write small tests, yet scales to support complex functional testing
- [pytest-cov](https://github.com/pytest-dev/pytest-cov) - Coverage plugin for pytest.
- [pre-commit](https://github.com/pre-commit/pre-commit) - A framework for managing and maintaining multi-language pre-commit hooks.

### Template

Since v2.8, PDM supports initializing a project from a template.

I have created a template [rudeigerc/pdm-template-rudeigerc](https://github.com/rudeigerc/pdm-template-rudeigerc) for my personal use mainly based on this tutorial.

You can initialize a project from this template with the following command:

```shell
pdm init https://github.com/rudeigerc/pdm-template-rudeigerc
```

Here are some other recommended Python project templates:

- [microsoft/python-package-template](https://github.com/microsoft/python-package-template)
