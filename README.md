# Course Template

## 组织方式

`mkdocs.yml`是配置文件，也是大纲页面展示方式，以及对应docker实验环境情况。

使用前，需要先配置docker-compose.yml。

## How to build？

本文档目前采用 [mkdocs](https://github.com/mkdocs/mkdocs)生成部署。当然本文档也可以部署在本地，具体方式如下

### 安装依赖

```shell
# mkdocs
pip install mkdocs
# extensions
pip install pymdown-extensions
# theme
pip install mkdocs-material
```

### 本地部署

```shell
# generate static file in site/
mkdocs build
# deploy at http://127.0.0.1:8000
mkdocs serve
# deploy using docker
docker-compose up
```

**mkdocs 本地部署的网站是动态更新的，即当你修改 md 文件时，网页也会尽可能的动态更新。**
