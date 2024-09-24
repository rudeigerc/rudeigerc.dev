---
title: 使用 Bcache 将 HDD 与 SSD 作为缓存的混合存储
description: 本文为使用 Bcache 将 HDD 与 SSD 作为缓存的混合存储时的笔记。
pubDate: 2020-10-10T00:12:21+08:00
categories:
  - storage
tags:
  - cache
---

## 引言

- [EnhanceIO](https://github.com/stec-inc/EnhanceIO)
- [flashcache](https://github.com/facebookarchive/flashcache)
- [dm-cache](https://www.kernel.org/doc/Documentation/device-mapper/cache.txt)
- [bcache](https://www.kernel.org/doc/Documentation/bcache.txt)

现在主流的解决方案应该是 dm-cache 和 bcache，前者在 3.9 的时候被 merge 进 Linux kernel tree，而后者是在 3.10 的时候，我们在这里选择使用 bcache。

```shell
$ cat /etc/redhat-release
CentOS Linux release 8.2.2004 (Core)
$ uname -r
4.18.0-193.19.1.el8_2
$ lsmod | grep bcache
$ modprobe bcache
modprobe: FATAL: Module bcache not found.
```

在 CentOS 8 中 bcache 默认不会被开启，因此我们需要自行编译内核并开启其中的 bcache 模块。

## 在内核中启用 bcache 模块

```
$ mkdir kernel && cd kernel
$ wget http://vault.centos.org/centos/8/BaseOS/Source/SPackages/kernel-4.18.0-80.11.2.el8_0.src.rpm
$ rpm2cpio kernel-4.18.0-80.11.2.el8_0.src.rpm | cpio -div
$ tar -xvf linux-4.18.0-80.11.2.el8_0.tar.xz
$ cd linux-4.18.0-80.11.2.el8_0
$ cp /boot/config-4.18.0-193.19.1.el8_2.x86_64 .config
$ dnf install -y gcc automake autoconf libtool make ncurses-devel bison flex
$ make menuconfig
```

`D`evice Drivers => M`u`ltiple devices driver support (RAID and LVM) => <\*> `B`lock device as cache

```shell
$ dnf install -y libelf-devel elfutils-libelf-devel rpm-build openssl-devel
$ make rpm
$ cd /root/rpmbuild/RPMS/x86_64
$ dnf install -y kernel-4.18.0kernel_bcache-1.x86_64.rpm
$ dnf install -y kernel-devel-4.18.0kernel_bcache-1.x86_64.rpm
$ dnf install -y kernel-headers-4.18.0kernel_bcache-1.x86_64.rpm
$ reboot
```

```shell
$ modprobe bcache
$ lsmod | grep bcache
bcache                274432  0
```

## bcache 设置

```shell
$ make && make install
cc -O2 -Wall -g `pkg-config --cflags uuid blkid`    make-bcache.c bcache.o  `pkg-config --libs uuid blkid` -o make-bcache
/tmp/cchr1HR5.o: In function `write_sb':
/root/bcache-tools/make-bcache.c:277: undefined reference to `crc64'
collect2: error: ld returned 1 exit status
make: *** [<builtin>: make-bcache] Error 1
```

根据 https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=777798, 由于 gcc 在 gcc-5 以上版本会编译失败，所以需要做出如下修改：

```diff
diff --git a/bcache.c b/bcache.c
index 8f37445..8b4b986 100644
--- a/bcache.c
+++ b/bcache.c
@@ -115,7 +115,7 @@ static const uint64_t crc_table[256] = {
        0x9AFCE626CE85B507ULL
 };

-inline uint64_t crc64(const void *_data, size_t len)
+uint64_t crc64(const void *_data, size_t len)
 {
        uint64_t crc = 0xFFFFFFFFFFFFFFFFULL;
        const unsigned char *data = _data;
```

```shell
$ lsblk /dev/sdc
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sdc           8:32   0  96.2T  0 disk
```

```shell
$ gdisk -l /dev/sdc
GPT fdisk (gdisk) version 1.0.3

Partition table scan:
  MBR: not present
  BSD: not present
  APM: not present
  GPT: not present

Creating new GPT entries.
Disk /dev/sdc: 206646018048 sectors, 96.2 TiB
Model: PERC H330 Adp
Sector size (logical/physical): 512/4096 bytes
Disk identifier (GUID): C712DA70-1BB0-45E5-A6EA-BE1CEC30DE13
Partition table holds up to 128 entries
Main partition table begins at sector 2 and ends at sector 33
First usable sector is 34, last usable sector is 206646018014
Partitions will be aligned on 2048-sector boundaries
Total free space is 206646017981 sectors (96.2 TiB)
```

```shell
$ gdisk /dev/sdc
GPT fdisk (gdisk) version 1.0.3

Partition table scan:
  MBR: not present
  BSD: not present
  APM: not present
  GPT: not present

Creating new GPT entries.

Command (? for help): ?
b	back up GPT data to a file
c	change a partition's name
d	delete a partition
i	show detailed information on a partition
l	list known partition types
n	add a new partition
o	create a new empty GUID partition table (GPT)
p	print the partition table
q	quit without saving changes
r	recovery and transformation options (experts only)
s	sort partitions
t	change a partition's type code
v	verify disk
w	write table to disk and exit
x	extra functionality (experts only)
?	print this menu

Command (? for help): n
Partition number (1-128, default 1): 1
First sector (34-206646018014, default = 2048) or {+-}size{KMGTP}:
Last sector (2048-206646018014, default = 206646018014) or {+-}size{KMGTP}: +30T
Current type is 'Linux filesystem'
Hex code or GUID (L to show codes, Enter = 8300):
Changed type of partition to 'Linux filesystem'

Command (? for help): n
Partition number (2-128, default 2): 2
First sector (34-206646018014, default = 64424511488) or {+-}size{KMGTP}:
Last sector (64424511488-206646018014, default = 206646018014) or {+-}size{KMGTP}: +30T
Current type is 'Linux filesystem'
Hex code or GUID (L to show codes, Enter = 8300):
Changed type of partition to 'Linux filesystem'

Command (? for help): n
Partition number (3-128, default 3):
First sector (34-206646018014, default = 128849020928) or {+-}size{KMGTP}:
Last sector (128849020928-206646018014, default = 206646018014) or {+-}size{KMGTP}:
Current type is 'Linux filesystem'
Hex code or GUID (L to show codes, Enter = 8300):
Changed type of partition to 'Linux filesystem'

Command (? for help): p
Disk /dev/sdc: 206646018048 sectors, 96.2 TiB
Model: PERC H330 Adp
Sector size (logical/physical): 512/4096 bytes
Disk identifier (GUID): 3F595DB4-EA86-4E06-AC94-A2FF0226716B
Partition table holds up to 128 entries
Main partition table begins at sector 2 and ends at sector 33
First usable sector is 34, last usable sector is 206646018014
Partitions will be aligned on 2048-sector boundaries
Total free space is 2014 sectors (1007.0 KiB)

Number  Start (sector)    End (sector)  Size       Code  Name
   1            2048     64424511487   30.0 TiB    8300  Linux filesystem
   2     64424511488    128849020927   30.0 TiB    8300  Linux filesystem
   3    128849020928    206646018014   36.2 TiB    8300  Linux filesystem

Command (? for help): w

Final checks complete. About to write GPT data. THIS WILL OVERWRITE EXISTING
PARTITIONS!!

Do you want to proceed? (Y/N): Y
OK; writing new GUID partition table (GPT) to /dev/sdc.
The operation has completed successfully.
```

```shell
$ make-bcache -B /dev/sdc1 /dev/sdc2 /dev/sdc3 -C /dev/sdb
UUID:			38dede02-5520-450a-8248-10263e15b5a1
Set UUID:		f856548a-e29b-4b89-b097-40d3b6b50ea2
version:		0
nbuckets:		1829376
block_size:		1
bucket_size:		1024
nr_in_set:		1
nr_this_dev:		0
first_bucket:		1
UUID:			f00b9417-3c93-4ffe-9b7d-d514a8e14666
Set UUID:		f856548a-e29b-4b89-b097-40d3b6b50ea2
version:		1
block_size:		1
data_offset:		16
UUID:			204774b5-79e7-4899-a3c5-bd1df37869db
Set UUID:		f856548a-e29b-4b89-b097-40d3b6b50ea2
version:		1
block_size:		1
data_offset:		16
UUID:			245818e5-a4ff-4787-b888-3165eb6bb2d7
Set UUID:		f856548a-e29b-4b89-b097-40d3b6b50ea2
version:		1
block_size:		1
data_offset:		16
```

```shell
$ lsblk /dev/sdb /dev/sdc
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sdb           8:16   0 893.3G  0 disk
├─bcache0   252:0    0    30T  0 disk
├─bcache1   252:128  0    30T  0 disk
└─bcache2   252:256  0  36.2T  0 disk
sdc           8:32   0  96.2T  0 disk
├─sdc1        8:33   0    30T  0 part
│ └─bcache0 252:0    0    30T  0 disk
├─sdc2        8:34   0    30T  0 part
│ └─bcache1 252:128  0    30T  0 disk
└─sdc3        8:35   0  36.2T  0 part
  └─bcache2 252:256  0  36.2T  0 disk
```

```shell
$ mkfs.ext4 -F /dev/bcache0
mke2fs 1.45.4 (23-Sep-2019)
Discarding device blocks: done
Creating filesystem with 8053063678 4k blocks and 503316480 inodes
Filesystem UUID: acb6fe94-3c89-482e-87bb-4f238247c51d
Superblock backups stored on blocks:
	32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632, 2654208,
	4096000, 7962624, 11239424, 20480000, 23887872, 71663616, 78675968,
	102400000, 214990848, 512000000, 550731776, 644972544, 1934917632,
	2560000000, 3855122432, 5804752896

Allocating group tables: done
Writing inode tables: done
Creating journal (262144 blocks): done
Writing superblocks and filesystem accounting information: done

$ mkfs.ext4 -F /dev/bcache1
$ mkfs.ext4 -F /dev/bcache2
```

```shell
$ mount /dev/bcache0 /mnt/bcache0
$ mount /dev/bcache1 /mnt/bcache1
$ mount /dev/bcache2 /mnt/bcache2
$ lsblk /dev/sdc
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sdc           8:32   0 96.2T  0 disk
├─sdc1        8:33   0   30T  0 part
│ └─bcache0 252:0    0   30T  0 disk /mnt/bcache0
├─sdc2        8:34   0   30T  0 part
│ └─bcache1 252:128  0   30T  0 disk /mnt/bcache1
└─sdc3        8:35   0 36.2T  0 part
  └─bcache2 252:256  0 36.2T  0 disk /mnt/bcache2
```

```shell
#!/bin/bash
# chkconfig: 2345 20 80

. /etc/init.d/functions

start() {
    modprobe bcache
    echo /dev/sdb > /sys/fs/bcache/register
    echo /dev/sdc1 > /sys/fs/bcache/register
    echo /dev/sdc2 > /sys/fs/bcache/register
    echo /dev/sdc3 > /sys/fs/bcache/register
    mount /dev/bcache0 /mnt/bcache0
    mount /dev/bcache1 /mnt/bcache1
    mount /dev/bcache2 /mnt/bcache2
}

stop() {
    unmount /dev/bcache0
    unmount /dev/bcache1
    unmount /dev/bcache2
}

case "$1" in
start)
    start
    ;;
stop)
    stop
    ;;
restart)
    stop
    start
    ;;
*)
    echo "Usage: $0 {start|stop|restart}"
esac

exit 0
```

```shell
$ chmod +x bcache
$ systemctl enable bcache.service
bcache.service is not a native service, redirecting to systemd-sysv-install.
Executing: /usr/lib/systemd/systemd-sysv-install enable bcache
$ reboot
```

```shell
$ df -h | grep bcache
/dev/bcache0          30T   24K   29T   1% /mnt/bcache0
/dev/bcache1          30T   24K   29T   1% /mnt/bcache1
/dev/bcache2          37T   24K   35T   1% /mnt/bcache2
```

## 参考

- [bcache.txt « Documentation - linux-bcache.git](https://evilpiepirate.org/git/linux-bcache.git/tree/Documentation/bcache.txt)
- [Bcache - ArchWiki](https://wiki.archlinux.org/index.php/Bcache)
- [TheAnonymous/Bcache Tutorial](https://gist.github.com/TheAnonymous/5787963)
- [Linux 下块设备缓存之 Bcache 使用（整理）](https://markrepo.github.io/maintenance/2018/09/10/bcache/)
- [Bcache 使用教程](https://ziyablog.com/266/bcache%E4%BD%BF%E7%94%A8%E6%95%99%E7%A8%8B/)
- [鲲鹏分布式存储解决方案 > 移植指南 > Bcache 移植指南（CentOS 7.6）](https://support.huaweicloud.com/prtg-kunpengsdss/kunpengbcache_02_0001.html)
- [dm-cache の技術概要と構築手順](https://qiita.com/Kaz_K/items/395aa8bbabd5601b12a1)
