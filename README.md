# Openclaw Course Portal

这是《从大模型到智能体：认知升级与实操落地》的本地演示门户页。

## 本地预览

```powershell
.\deploy-local.ps1
```

默认地址：

```text
http://127.0.0.1:4173/
```

这套预览不依赖 npm，不安装依赖。`deploy-local.ps1` 会直接用本机 Node.js 启动本地静态服务。
如果 4173 被占用，启动器会自动尝试后续端口，并在终端输出实际 URL。
