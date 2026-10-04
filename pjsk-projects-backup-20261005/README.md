# PJSK 项目完整备份 — 2026-10-05

本目录独立于现有网站，未修改网站文件。

包含中二→PJSK 移植代码、缓存与记录；曲线制谱器源码、依赖、编译产物；原版参考源码；测试工具；01–11 曲目全部输出；制谱器成品；Melodiniq WAV/MP3/JPG 与原始 music2999 目录。

## 还原

下载本目录全部文件，在安装 Python 的电脑运行 `python restore.py`。程序会校验分卷 SHA256、合并 ZIP、验证压缩文件并解压到 `restored`。Windows 路径映射：pjsk-port/mmw4uc-curve/mmw-up/mmw-tools 原来在 C:\Claude；charts 与 editor-release 原来在 Downloads。

原项目 .git 目录未打入 ZIP；两份源码的提交历史另存为 .bundle，支持 git clone 文件.bundle。ZIP 包含当前工作树实际文件，包括未提交修改。manifest.json 记录每个原文件的大小与 SHA256。

曲线制谱器分支 aplusc，用户确认标记 release-preview。VS2019 BuildTools 编译前设置 CL=/utf-8 /FIchrono，运行 MSBuild MikuMikuWorld.sln /p:Configuration=Release /p:Platform=x64 /p:PlatformToolset=v142 /m。编译后只替换成品 exe。
