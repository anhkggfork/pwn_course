---
presentation:
  width: 1600
  height: 900
  slideNumber: 'c/t'
  showSlideNumber: "all"
  center: true
  enableSpeakerNotes: true
  theme: none.css
---
<!-- slide data-notes="" -->
# c语言函数调用栈
Function Call

<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
func(arg1,arg2);<br>

...<br/>
push arg2<br>
push arg1<br/>
call func<br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;" >
<tr>
<td rowspan="5"></td>
<td rowspan="5"></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap">esp---------></td>
<td>&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>
<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
func(arg1,<font color=red>arg2</font>);<br>

...<br/>
<font color=red>push arg2</font><br>
push arg1<br/>
call func<br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td rowspan="5"></td>
<td rowspan="5"></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap">esp---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>
<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
func(<font color=green>arg1</font>,<font color=red>arg2</font>);<br>

...<br/>
<font color=red>push arg2</font><br>
<font color=green>push arg1</font><br/>
call func<br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td rowspan="4"></td>
<td rowspan="4"></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap">esp---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=green>arg1</font>&#160&#160&#160&#160&#160</td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>
<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
<font color=blue>func</font>(<font color=green>arg1</font>,<font color=red>arg2</font>);<br>

...<br/>
<font color=red>push arg2</font><br>
<font color=green>push arg1</font><br/>
<font color=blue>call func</font><br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td rowspan="3"></td>
<td rowspan="3"></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap">esp---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>ret_addr</font>&#160</td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=green>arg1</font>&#160&#160&#160&#160&#160</td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>
<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
<font color=blue>func</font>(<font color=green>arg1</font>,<font color=red>arg2</font>)<br>
{<br>
    char buffer[8];<br>
}<br>

...<br/>
<font >push ebp</font><br>
<font >mov ebp,esp</font><br/>
<font >sub esp, 8</font><br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td rowspan="3"></td>
<td rowspan="3"></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap">esp---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>ret_addr</font>&#160</td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=green>arg1</font>&#160&#160&#160&#160&#160</td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>

<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
<font color=blue>func</font>(<font color=green>arg1</font>,<font color=red>arg2</font>)<br>
{<br>
    char buffer[8];<br>
}<br>

...<br/>
<font color=red>push ebp</font><br>
<font >mov ebp,esp</font><br/>
<font >sub esp, 8</font><br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td rowspan="2"></td>
<td rowspan="2"></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap">esp---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>pre_ebp</font></td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>ret_addr</font></td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=green>arg1</font></td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>
<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
<font color=blue>func</font>(<font color=green>arg1</font>,<font color=red>arg2</font>)<br>
{<br>
    char buffer[8];<br>
}<br>

...<br/>
<font color=red>push ebp</font><br>
<font color=green>mov ebp,esp</font><br/>
<font >sub esp, 8</font><br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td rowspan="2"></td>
<td rowspan="2"></td>
</tr>
<tr>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap"><font color=green>ebp</font>,esp-----></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>pre_ebp</font></td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>ret_addr</font></td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=green>arg1</font></td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>

<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
<font color=blue>func</font>(<font color=green>arg1</font>,<font color=red>arg2</font>)<br>
{<br>
    char buffer[8];<br>
}<br>

...<br/>
<font color=red>push ebp</font><br>
<font color=green>mov ebp,esp</font><br/>
<font color=blue>sub esp, 8</font><br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td rowspan="1"></td>
<td rowspan="1"></td>
</tr>
<tr>
<td><font color=blue>esp</font>---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>buffer</font></td>
</tr>
<tr>
<td><font color=green>ebp</font>---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>pre_ebp</font></td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>ret_addr</font></td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=green>arg1</font></td>
</tr>
<tr>
<td></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>
<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
<font color=blue>func</font>(<font color=green>arg1</font>,<font color=red>arg2</font>)<br>
{<br>
    char buffer[8];<br>
}<br>

...<br/>
<font color=red>push ebp</font><br>
<font color=green>mov ebp,esp</font><br/>
<font color=blue>sub esp, 8</font><br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td><font >ebp-8</font></td>
<td rowspan="2">&#160&#160&#160&#160&#160&#160<font color=blue>buffer</font></td>
</tr>
<tr>
<td><font >ebp-4</font></td>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap"><font color=green >ebp</font>---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>pre_ebp</font></td>
</tr>
<tr>
<td><font >ebp+4</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>ret_addr</font></td>
</tr>
<tr>
<td><font >ebp+8</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=green>arg1</font></td>
</tr>
<tr>
<td><font >ebp+c</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>
<!-- slide data-notes="" -->
<div id="left">
...<br/>
<br/>
<font color=blue>func</font>(<font color=green>arg1</font>,<font color=red>arg2</font>)<br>
{<br>
    char buffer[8];<br>
    gets(&buffer);//dangerous!<br>
}<br>

...<br/>
<font color=red>push ebp</font><br>
<font color=green>mov ebp,esp</font><br/>
<font color=blue>sub esp, 8</font><br/>
</div>

<div id="right">

<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td><font >ebp-8</font></td>
<td rowspan="2">&#160&#160&#160&#160&#160&#160<font color=blue>buffer</font></td>
</tr>
<tr>
<td><font >ebp-4</font></td>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap"><font color=green >ebp</font>---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>pre_ebp</font></td>
</tr>
<tr>
<td><font >ebp+4</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>ret_addr</font></td>
</tr>
<tr>
<td><font >ebp+8</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=green>arg1</font></td>
</tr>
<tr>
<td><font >ebp+c</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>
<!-- slide data-notes="" -->
- 无论输入的数据有多大，只要不换行，gets()总会把输入数据放入buffer。
- 输入“很多”个"A"？
<!-- slide  -->
<div id="left">
<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td><font >ebp-8</font></td>
<td rowspan="2">&#160&#160&#160&#160&#160&#160<font color=blue>buffer</font></td>
</tr>
<tr>
<td><font >ebp-4</font></td>
<td></td>
</tr>
<tr>
<td style="white-space:nowrap"><font color=green >ebp</font>---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>pre_ebp</font></td>
</tr>
<tr>
<td><font >ebp+4</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>ret_addr</font></td>
</tr>
<tr>
<td><font >ebp+8</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=green>arg1</font></td>
</tr>
<tr>
<td><font >ebp+c</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>arg2</font>&#160&#160&#160&#160&#160</td>
</tr>
</table>
</div>



<div id="right">
<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td><font >ebp-8</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td><font >ebp-4</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td style="white-space:nowrap"><font color=green >ebp</font>---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td><font >ebp+4</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>aaaa</font></td>
</tr>
<tr>
<td><font >ebp+8</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td><font >ebp+c</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
</table>
</div>
<!-- slide  -->
<div id="left">
<br/>
<font color=blue>func</font>(<font color=green>arg1</font>,<font color=red>arg2</font>)<br>
{<br>
    char buffer[8];<br>
    ...<br>
    gets(&buffer);//dangerous!<br>
    ...<br>
    return;<br>
}<br>
...<br/>
<font >mov esp,ebp</font><br>
<font >pop ebp</font><br/>
<font >ret</font><br/>
</div>
<div id="right">
<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td style="white-space:nowrap"><font >esp</font>---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td><font >ebp-4</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td style="white-space:nowrap"><font color=green >ebp</font>---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td><font >ebp+4</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>aaaa</font></td>
</tr>
<tr>
<td><font >ebp+8</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td><font >ebp+c</font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
</table>
</div>
<!-- slide data-notes="" -->
<div id="left">
<br/>
<font color=blue>func</font>(<font color=green>arg1</font>,<font color=red>arg2</font>)<br>
{<br>
    char buffer[8];<br>
    ...<br>
    gets(&buffer);//dangerous!<br>
    ...<br>
    return;<br>
}<br>
...<br/>
<font >mov esp,ebp</font><br>
<font >pop ebp</font><br/>
<font color=red>ret</font>（=pop eip）<br/>
</div>
<div id="right">
<table border="1" style="font-size:50px;font-family:serif;">
<tr>
<td><font ></font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td><font ></font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td style="white-space:nowrap"></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td style="white-space:nowrap"><font color=red >esp</font>---------></td>
<td>&#160&#160&#160&#160&#160&#160<font color=red>aaaa</font></td>
</tr>
<tr>
<td><font ></font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
<tr>
<td><font ></font></td>
<td>&#160&#160&#160&#160&#160&#160<font color=blue>aaaa</font></td>
</tr>
</table>
</div>

<!-- slide data-notes="" -->
##结果
eip = 'aaaa'
程序的执行流被修改。