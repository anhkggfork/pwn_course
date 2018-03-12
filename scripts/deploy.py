#!/usr/bin/env python2
# -*- coding:utf-8 -*-
import os, re
import sys,os
import chardet
import codecs
import requests
import time
import uuid

from pyquery import PyQuery as pq
from shutil import copy
import paramiko
from mkdocs import config
import pprint
pp = pprint.PrettyPrinter(indent=4)

# default encoding: utf8
# 解决中文与ascii编码混杂的问题
reload(sys)
sys.setdefaultencoding('utf8')

def copyBySSH(localfilepath, remotefilepath):
    ssh_client =paramiko.SSHClient()
    ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh_client.connect(hostname='10.10.55.10',username='root',password='ycxx123#')
    ftp_client=ssh_client.open_sftp()
    ftp_client.put(localfilepath, remotefilepath)
    ftp_client.close()

def wgetImage(savepath, url):
    img_data = requests.get(url).content
    img_name = os.path.realpath(os.path.join(savepath, url.split("/")[-1]))
    with open(img_name, 'wb') as handler:
        handler.write(img_data)
    return img_name

def HandleLocalTag(htmlpath, html):
    htmldirpath = htmlpath[0:htmlpath.rfind('/')]
    
    copy_path = '/home/x-oj/media/course/temp_ctfwiki_attachment'
    relative_copy_path = '/media/course/temp_ctfwiki_attachment/'
    html_str_content = html
    p = pq(html_str_content)
    for event in p('a'):
        event = pq(event)
        url = event('a').attr('href')
        if not url.startswith("../"):
            continue
        full_attach_localpath = os.path.realpath(os.path.join(htmldirpath, url))
        # print url
        if len(url.split('/')) > 1:
            new_url = url.split('/')[-1]
        new_img_name = str(uuid.uuid4())[:4] + '-' + new_url
        # print new_img_name

        # scp from local to remote
        copyBySSH(full_attach_localpath, os.path.join(copy_path, new_img_name))
        html_str_content = html_str_content.replace('href=' + '"' + url + '"',
                                                    'href=' + '"' + relative_copy_path + new_img_name + '"')
    return html_str_content




def HandleImage(htmlpath, html):
    htmldirpath = htmlpath[0:htmlpath.rfind('/')]

    copy_path = '/home/x-oj/media/course/temp_md_img'
    relative_copy_path = '/media/course/temp_md_img/'
    html_str_content = html
    p = pq(html_str_content)
    for event in p('img'):
        event = pq(event)
        url = event('img').attr('src')
        if url.startswith("http"):
            full_img_localpath = wgetImage(htmldirpath, url)
        else:
            full_img_localpath = os.path.realpath(os.path.join(htmldirpath, url))

        if len(url.split('/')) > 1:
            new_url = url.split('/')[-1]
        new_img_name = str(uuid.uuid4()) + '.' + new_url.split('.')[-1]

        # scp from local to remote
        copyBySSH(full_img_localpath, os.path.join(copy_path, new_img_name))
        html_str_content = html_str_content.replace('src=' + '"' + url + '"',
                                                    'src=' + '"' + relative_copy_path + new_img_name + '"')
    return html_str_content


def CreateLesson(title, filepath):
    fd = open(filepath, "r")
    html = fd.read()
    fd.close()
    name = title

    mycookie = { "sessionid":"yp27zbsjhucav08x6hjfjzpsfkfb50cf","csrftoken":"CGRzZ6JaNIvAvYkcedBLPy6EasriMALDgOpevPGP0UcW9hWLuglfN9YCqeTiiOfV"}
    url = "http://10.10.55.10/admin/course/api/lessons/"

    html = HandleImage(filepath, html)
    html = HandleLocalTag(filepath, html)

    values={'csrfmiddlewaretoken':'2dZdBUgPMbAid9Qz0iAwhV7PSmRW2rJdGlxS7DduZnhERss8glk0fwZN88jWyFdv',
            'course':358,
            'public':'true',
            'type': 1,
            'name':name,
            'markdown':html}
    r = requests.post(url, data=values,cookies = mycookie)
    print "[+] OK!"
    # print r.text

def HandleSingle(title, mdpath):
    prefix = "./site/"
    postfix = "/index.html"
    htmlpath = os.path.join(prefix,mdpath[:-3]+postfix)
    # pp.pprint(title)
    pp.pprint(htmlpath)
    CreateLesson(title, htmlpath)

def HandleYaml(confFile):
    '''
    从YAML文件，处理课程目录
    '''
    conf = config.load_config(config_file=confFile)
    pages = conf["pages"]
    for category in pages:
        for categoryName, values in category.items():
            for item in values:
                for level1_key, level1_value in item.items():
                    title1 = level1_key
                    if isinstance(level1_value, unicode):
                        title = " - ".join([categoryName, level1_key])
                        HandleSingle(title, level1_value)

                    elif isinstance(level1_value, list):
                        for item in level1_value:
                            for level2_key, level2_value in item.items():
                                if isinstance(level2_value, list):
                                    for item in level2_value:
                                        for level3_key, level3_value in item.items():
                                            title = " - ".join([categoryName, level1_key, level2_key, level3_key])
                                            HandleSingle(title, level3_value)
                                else:
                                    title = " - ".join([categoryName, level1_key, level2_key])
                                    HandleSingle(title, level2_value)

                    else:
                        # None
                        pp.pprint("Fatal Error")
if __name__ == "__main__":
    # filepath = "./site/introduction/mode/index.html"
    # filepath = "./site/reverse/linux/ld_preload/index.html"
    # CreateLesson("test123", filepath)
    HandleYaml("mkdocs.yml")

"""
csrfmiddlewaretoken:fgMuckBfwYMR9NvZlj4MPxyx4t9lSGiKkkoukEc7FcffVLs2FgFWd310MHJ3u9Mr
course:357
name:bbb
type:0
pdf:
video:
attachment:
lesson_env__env:
lesson_env__type:1
difficulty:0
duration:0
public:0
"""
