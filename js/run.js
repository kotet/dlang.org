/**
Runnable examples functionality

Copyright: 2012 by Digital Mars

License:   http://boost.org/LICENSE_1_0.txt, Boost License 1.0

Authors:   Andrei Alexandrescu, Damian Ziemba
*/

/**
Script workflow:

1. Scan current document DOM tree for <pre> elements with class=d_code.
    <pre class="d_code">...</pre> blocks are generated by DDOC example sections.
2. Iterate each pre element and apply our custom form, replacing default <pre> block
3. Get text from original <pre> block, strip any spaces and newlines from it and compute md5sum
4. Look up mainPage map with md5sum as a key and see if there are any elements associated with this key
5. If yes: Add to our custom form default Standard input and/or Standard Arguments, stdin being 0 key, stdout 1 key.
6. If no: Just skip to point 7
7. Continue to next <pre> element and repeat begging from point 2 if there are still nodes left

How to add new example or update existing:

If example doesn't require any standard input neither standard argugments by default you are done.
Otherwise, copy example text without example separator ie:

------
[start here]
import std.stdio;

void main(string[] args) {
    writeln("Hello world. ", args);
    writeln("What's your name?");
    writeln("Hello ", readln());
}
[end here]
------

Go to http://dpaste.dzfl.pl/md5sum, paste your example to Source box and click "Compute".
Copy generated md5sum. Open run-main-website.js file and add following

mainPage["yourMd5Sum"] = ["standard input is has 0 position", "standard args has 1 position"];

Save, reload website and see if standard input and/or standard arguments are displayed in your example form.

TL;DR
All examples are replaced with custom form by default. You need to do additional work only if you wan't
your example to have deafault standard input or default standard arguments.

*/

/**
Taken from http://www.webtoolkit.info/javascript-md5.html
*/
var MD5 = function (string) {

    function RotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    }

    function AddUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }

    function F(x,y,z) { return (x & y) | ((~x) & z); }
    function G(x,y,z) { return (x & z) | (y & (~z)); }
    function H(x,y,z) { return (x ^ y ^ z); }
    function I(x,y,z) { return (y ^ (x | (~z))); }

    function FF(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function GG(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function HH(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function II(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
    };

    function WordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
            lByte = (lValue>>>(lCount*8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
    };

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    };

    var x=Array();
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;

    string = Utf8Encode(string);

    x = ConvertToWordArray(string);

    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
    }

    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

    return temp.toLowerCase();
}

var nl2br = function()
{
    return this.replace(/\n/g, "<br>");
}

function safeVar(data, path)
{
    var p = path.split(".");
    var res = null;

    try
    {
        res = data[p[0]][p[1]];
        if (typeof res == "object")
            res = "";
    }
    catch (e)
    {
        return "";
    }

    return res;
}

function parseOutput(data, o, oTitle)
{
    if (typeof data.compilation == "undefined")
    {
        o.text("Temporarily unavailable");
        return;
    }

    var output = "";
    var cout = safeVar(data, "compilation.stdout");
    var stdout = safeVar(data, "runtime.stdout");
    var stderr = safeVar(data, "runtime.stderr");
    var ctime = parseInt(safeVar(data, "compilation.time"));
    var rtime = parseInt(safeVar(data, "runtime.time"));
    var cstatus = parseInt(safeVar(data, "compilation.status"));
    var rstatus = parseInt(safeVar(data, "runtime.status"));
    var cerr = safeVar(data, "compilation.err");
    var rerr = safeVar(data, "runtime.err");
    var defaultOutput = data.defaultOutput || '-- No output --';

    if (cstatus != 0)
    {
        oTitle.text("Compilation output ("+cstatus+": "+cerr+")");
        if ($.browser.msie)
            o.html(nl2br(cout));
        else
            o.text(cout);

        return;
    }
    else
    {
        oTitle.text("Application output");// (compile "+ctime+"ms, run "+rtime+"ms)");
        if ( cout != "")
            output = 'Compilation output: \n' + cout + "\n";

        output += (stdout == "" && stderr == "" ? defaultOutput : stdout);

        if (stderr != "")
            output += stderr;

        if (rstatus != 0)
            oTitle.text("Application output ("+rstatus+": "+rerr+")");
    }

    if ($.browser.msie)
        o.html(nl2br(cout));
    else
        o.text(output);
}

$(document).ready(function()
{
    setUpExamples();

    var currentPage = $(location).attr('pathname');

    $('.runnable-examples').each(function(index)
    {
        var el = $(this).children().first();
        var stripedText = el.text().replace(/\s/gm,'');
        var md5sum = MD5(stripedText);

        var stdin = "";
        var args = "";
        var currentExample = el;
        var orig = currentExample.html();

        if (typeof mainPage !== 'undefined' && md5sum in mainPage)
        {
            var elements = mainPage[md5sum];

            if (elements == null)
                return; // this example is not runnable online

            if (elements[0] != null)
                stdin = elements[0];

            if (elements[1] != null)
                args = elements[1];
        }

        currentExample.replaceWith(
            '<div class="d_code"><pre class="d_code">'+orig+'</pre></div>'
            + '<div class="d_run_code">'
            + '<textarea class="d_code" style="display: none;"></textarea>'
            + '<div class="d_code_stdin"><span class="d_code_title">Standard input</span><br>'
            + '<textarea class="d_code_stdin">'+stdin+'</textarea></div>'
            + '<div class="d_code_args"><span class="d_code_title">Command line arguments</span><br>'
            + '<textarea class="d_code_args">'+args+'</textarea></div>'
            + '<div class="d_code_output"><span class="d_code_title">Application output</span><br><pre class="d_code_output" readonly>Running...</pre></div>'
            + '<input type="button" class="editButton" value="Edit">'
            + '<input type="button" class="argsButton" value="Args">'
            + '<input type="button" class="inputButton" value="Input">'
            + '<input type="button" class="runButton" value="Run">'
            + '<input type="button" class="resetButton" value="Reset"></div>'
        );
    });

    $('textarea[class=d_code]').each(function(index) {
        var parent = $(this).parent();
        var outputDiv = parent.children("div.d_code_output");
        setupTextarea(this, {parent: parent, outputDiv: outputDiv,
                        stdin: true, args: true});
    });
});

function setupTextarea(el, opts)
{
    opts = opts || {};
    // set default opts
    opts = jQuery.extend({}, {
        stdin: false,
        args: false,
        transformOutput: function(out) { return out }
    }, opts);

    if (!!opts.parent)
        var parent = opts.parent;
    else
        console.error("parent node node not found");

    if (!!opts.outputDiv)
        var outputDiv = opts.outputDiv;
    else
        console.error("outputDiv node not found");

    var thisObj = $(el);
    parent.css("display", "block");
    var orgSrc = parent.parent().children("div.d_code").children("pre.d_code");

    var prepareForMain = function()
    {
        var src = $.browser.msie && $.browser.version < 9.0 ? orgSrc[0].innerText : orgSrc.text();
        var arr = src.split("\n");
        var str = "";
        for ( i = 0; i < arr.length; i++)
        {
            str += arr[i]+"\n";
        }
        if ($.browser.msie && $.browser.version < 9.0)
            str = str.substr(0, str.length - 1);
        else
            str = str.substr(0, str.length - 2);

        return str;
    };

    var editor = CodeMirror.fromTextArea(thisObj[0], {
        lineNumbers: true,
        tabSize: 4,
        indentUnit: 4,
        indentWithTabs: true,
        mode: "text/x-d",
        lineWrapping: true,
        theme: "eclipse",
        readOnly: false,
        matchBrackets: true
    });

    editor.setValue(prepareForMain());

    var height = function(diff) {
        var par = code != null ? code : parent.parent().children("div.d_code");
        return (parseInt(par.css('height')) - diff) + 'px';
    };

    var runBtn = parent.children("input.runButton");
    var editBtn = parent.children("input.editButton");
    var resetBtn = parent.children("input.resetButton");

    var code = $(editor.getWrapperElement());
    code.css('display', 'none');

    var plainSourceCode = parent.parent().children("div.d_code");

    var output = outputDiv.children("pre.d_code_output");
    var outputTitle = outputDiv.children("span.d_code_title");
    if (opts.args) {
        var argsBtn = parent.children("input.argsButton");
        var argsDiv = parent.children("div.d_code_args");
        var args = argsDiv.children("textarea.d_code_args");
        var orgArgs = args.val();
    }
    if (opts.stdin) {
        var inputBtn = parent.children("input.inputButton");
        var stdinDiv = parent.children("div.d_code_stdin");
        var stdin = stdinDiv.children("textarea.d_code_stdin");
        var orgStdin = stdin.val();
    }

    var hideAllWindows = function(optArguments)
    {
        optArguments = optArguments || {};
        if (opts.stdin) {
            stdinDiv.css('display', 'none');
        }
        if (opts.args) {
            argsDiv.css('display', 'none');
        }
        outputDiv.css('display', 'none');
        if (!optArguments.keepPlainSourceCode) {
          plainSourceCode.css('display', 'none');
        }
        if (!optArguments.keepCode) {
          code.css('display', 'none');
        }
    };

    if (opts.args) {
        argsBtn.click(function(){
            resetBtn.css('display', 'inline-block');
            args.css('height', height(31));
            hideAllWindows();
            argsDiv.css('display', 'block');
            args.focus();
        });
    }

    if (opts.stdin) {
        inputBtn.click(function(){
            resetBtn.css('display', 'inline-block');
            stdin.css('height', height(31));
            hideAllWindows();
            stdinDiv.css('display', 'block');
            stdin.focus();
        });
    }

    editBtn.click(function(){
        resetBtn.css('display', 'inline-block');
        hideAllWindows();
        code.css('display', 'block');
        editor.refresh();
        editor.focus();
    });
    resetBtn.click(function(){
        resetBtn.css('display', 'none');
        editor.setValue(prepareForMain());
        if (opts.args) {
            args.val(orgArgs);
        }
        if (opts.stdin) {
            stdin.val(orgStdin);
        }
        hideAllWindows();
        plainSourceCode.css('display', 'block');
    });
    runBtn.click(function(){
        resetBtn.css('display', 'inline-block');
        $(this).attr("disabled", true);
        var optArguments = {};
        // check what boxes are currently open
        if (opts.keepCode) {
          optArguments.keepCode = code.is(":visible");
          optArguments.keepPlainSourceCode = plainSourceCode.is(":visible");
        }
        hideAllWindows(optArguments);
        output.css('height', opts.outputHeight || height(31));
        outputDiv.css('display', 'block');
        outputTitle.text("Application output");
        output.html("Running...");
        output.focus();

        var data = {
                'code' : opts.transformOutput(editor.getValue()),
        }
        if (opts.stdin) {
            data.stdin = stdin.val();
        }
        if (opts.args) {
            data.args = args.val();
        }
        $.ajax({
            type: 'POST',
            url: "https://dpaste.dzfl.pl/request/",
            dataType: "json",
            data: data,
            success: function(data)
            {
                data.defaultOutput = opts.defaultOutput;
                parseOutput(data, output, outputTitle);
                runBtn.attr("disabled", false);
            },
            error: function(jqXHR, textStatus, errorThrown )
            {
                output.html("Temporarily unavailable");
                if (typeof console != "undefined")
                {
                    console.log(textStatus + ": " + errorThrown);
                }

                runBtn.attr("disabled", false);
            }
        });
    });
    return editor;
};


function setUpExamples()
{
    /* Sets up expandable example boxes.
     * max-height and CSS transitions are used to animate the closing and opening for smooth animations even on less powerful devices
     */
    $('.example-box').each(function() {
        var $box = $(this);
        var boxId = $box.attr('id');
        // A little juggling here because the content needs to be a block element and the control needs to be an inline
        // element in the previous paragraph.
        var $control = $('#' + boxId + '-control');
        $control.attr('aria-controls', boxId);
        var $showLabel = $('<span>Show example <i class="fa fa-caret-down"></i></span>');
        var $hideLabel = $('<span>Hide example <i class="fa fa-caret-up"></i></span>');
        function toggle() {
            if ($box.attr('aria-hidden') === 'true') {
                $box.attr('aria-hidden', false);
                $control.attr('aria-expanded', true);
                $control.empty().append($hideLabel);
                $box.css('max-height', $box[0].scrollHeight);
            } else {
                $box.attr('aria-hidden', true);
                $control.attr('aria-expanded', false);
                $control.empty().append($showLabel);
                $box.css('max-height', 0);
            }
            return false;
        }
        $control.on('click', toggle);
        toggle();
    });
    // NB: href needed for browsers to include the controls in the (keyboard) tab order
    $('.example-control').attr('href', '#');
}
