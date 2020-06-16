var corners = ["controllerContainerTopLeft", "controllerContainerTopCenter", "controllerContainerTopRight", "controllerContainerBottomLeft", "controllerContainerBottomCenter", "controllerContainerBottomRight"];
var buttons = new Object();

var tl = [];
var tc = [];
var tr = [];
var bl = ["play", "prev", "next", "zoomin", "fullscreen"];
var bc = [];
var br = [];

buttons["controllerContainerTopLeft"] = tl;
buttons["controllerContainerTopCenter"] = tc;
buttons["controllerContainerTopRight"] = tr;
buttons["controllerContainerBottomLeft"] = bl;
buttons["controllerContainerBottomCenter"] = bc;
buttons["controllerContainerBottomRight"] = br;

for (var c=0; c<corners.length; c++)
{
    var btns = buttons[corners[c]];

    for (var i=0; i<btns.length; i++)
    {
        if (document.getElementById(btns[i]))
        {
            var element = document.getElementById(btns[i]);
            document.getElementById(corners[c]).appendChild(element); 
        }
    }
}
