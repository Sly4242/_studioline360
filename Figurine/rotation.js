
/*******************************************************************************************\
* Copyright 2002-2020 (C) Digital Multi-Media Design (DMMD), LLC (http://www.dmmd.net)      *
* This file is part of DMMD's Software Library.                                             *
* The software is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; *
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. *
* DMMD can customize or expand this code for your own application.                          *
* Please contact us at contact@dmmd.net or via phone, at 7 0 3 - 4 3 9 - 0 0 6 7 (USA)      *
* or visit us at our website (http://dmmd.net).                                             *
\*******************************************************************************************/

var loadedImages = [];

(function()
{
    function arrayRotate(arr, count)
    {
        count -= arr.length * Math.floor(count / arr.length);
        arr.push.apply(arr, arr.splice(0, count));
    }

    function hotspotsRotate(count)
    {
        var firstNewIndex = imagePaths.length-count;

        for (var row=0; row<rowsCols.length; row++)
        {
            var hotspots = rowsCols[row];

            for (var h=0; h<hotspots.length; h++)
            {
                var hotspot = hotspots[h];

                hotspot.hotspotColumn = hotspot.hotspotColumn+firstNewIndex;
            }
        }
    }

    window.addEventListener("load", function()
    {
        /*
        if (firstImageIndex > 0)
        {
            arrayRotate(imagePaths, firstImageIndex);
            hotspotsRotate(firstImageIndex);
        }
        */

        var loader = new PxLoader();

        var total = imagePaths.length;
        var count = 0;

        for (var i=0; i<total; i++)
        {
            var src = imagePaths[i];
            //console.log(src);

            var pxImage = new PxLoaderImage(src);
            pxImage.imageNumber = i + 1;
            loader.add(pxImage);
            loadedImages[i] = pxImage;
        }

        loader.addProgressListener(function(e)
        {
            document.getElementById("progressElement").value = e.completedCount;

            if (e.completedCount === e.totalCount)
            {
                //console.log(loadedImages[0].img);
                document.getElementById("progressLoader").style.display = "none";
                mainFunction();
            }
        });

        loader.start();
    });
})();

function mainFunction()
{
    var isTopWindow = false;
    var fullscreenControl = $("#fullscreen");
    var hotspotCanvas = $("#hotspotcanvas");
    var canvasContext = hotspotCanvas[0].getContext('2d');
    var hotspotCanvasElement = document.getElementById("hotspotcanvas");
    var playPauseControl = $("#play");
    var prevControl = $("#prev");
    var nextControl = $("#next");
    var zoomIn = $("#zoomin");
    var zoomCheck = $("#zoomcheck");
    var zoomPanel = $("#inverted-contain");
    var zoomImage = $("#zoomimg");
    var topContainer = $("#topContainer");
    var topContainerElement = document.getElementById("topContainer");
    var imageContainer = $("#imageContainer");
    var controllerContainer = $("#controllerContainer");
    var images = imageContainer.find("img");
    var imagesCount = loadedImages.length;
    var multiRowArray = new Array(numberOfRows);
    var isClicked = false;
    var currentPositionX;
    var currentPositionY;
    var currentImage = 0;

    if (firstImageIndex > 0)
    {
        currentImage = firstImageIndex;
    }

    var previousImage = 0;

    var animation;

    var canvas;
    var radius = 15;

    // default initial zoom parameters
    var valueZoom = maxZoom;
    var minZoom = 1.0;
    var stepZoom = 0.1;
    stepZoom *= zoomSensitivity;

    var wasPlaying = false;

    var isHotspotImage = false;

    var isZooming = false;
    var isZoomClicked = false;
    var currentZoomXPosition = 0;
    var currentZoomYPosition = 0;
    var zoomBackgroundPosition = "center";

    var zoomDragPosX = 0;
    var zoomDragPosY = 0;

    var isBouncingFinished = false;
    var bounceRotationCount = 0;

    //

    var isAtTop = false;
    var isAtRight = false;
    var isAtBottom = false;
    var isAtLeft = false;

    var zoomedDraggableWidth = 0;
    var zoomedDraggableHeight = 0;

    var mouseDownXPosition = 0;
    var mouseDownYPosition = 0;

    var isFirstDrag = true;

    var hotspotImageWidth = 24;
    var hotspotImageHeight = 24;

    var touchZoomDistanceStart;
    var touchZoomDistanceEnd;

    var zoomTouchDistanceOld = 0;
    var stepPinchZoom = 0.1;

    //var currentRow = 0;
    var currentRow = firstRow-1;

    var $panzoom;

    var zoomDivClose;
    var zoomDivCloseContainer;
    var zoomDivCloseDescription;

    //

    zoomImage.attr("src", "#");
    zoomImage.attr("display", "none");

    //

    hotspotCanvas.css("cursor", "-webkit-"+cursorHoverName);
    hotspotCanvas.css("cursor", cursorHoverName);

    //

    var friction = 0.85;

    var mouse = { x: 0, y: 0 };
    var position = { x: 0, y: 0 };
    var previous = { x: position.x, y: position.y };
    var velocity = { x: 0, y: 0 };

    //

    var opacity = 1;
    canvasContext.globalAlpha = 1;

    var fps = 30;
    var now;
    var then = Date.now();
    var interval = 1000/fps;
    var delta;

    //

    var logoImageSrc = $('#logocontainer').find('img:first').attr('src');

    function isValidImageUrl(url)
    {
        if (typeof url == 'undefined')
        {
            return false;
        }

        var image = new Image();
        image.src = url;

        if (image.width === 0)
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    if (!isValidImageUrl(logoImageSrc))
    {
        $('#logocontainer').css({"visibility":"hidden"});
    }

    //

    if (self == top)
    {
        isTopWindow = true;

        if (deepZoom === 1)
        {
            $('img').prop('src', function ()
            {
                return this.src.replace("img/", "imglarge/");
            });
        }
    }
    else
    {
        isTopWindow = false;
    }

    if (!isTopWindow)
    {
        hotspotCanvas[0].width = normalWidth;
        hotspotCanvas[0].height = normalHeight;
    }
    else
    {
        hotspotCanvas[0].width = largeWidth;
        hotspotCanvas[0].height = largeHeight;
    }

    hotspotCanvas = $("#hotspotcanvas");
    canvasContext = hotspotCanvas[0].getContext('2d');

    var multiRowCount = 0;
    var imageRowCount = 0;

    for (var i=0; i<numberOfRows; i++)
    {
        multiRowArray[i] = new Array(imagesCount/numberOfRows);
        imageRowCount = 0;

        for (var j=multiRowCount; j<(multiRowCount+(imagesCount/numberOfRows)); j++)
        {
            multiRowArray[i][imageRowCount] = loadedImages[j].img;

            imageRowCount++;
        }

        multiRowCount += imagesCount/numberOfRows;
    }

    var img = multiRowArray[currentRow][currentImage];

    if (!isTopWindow)
    {
        canvasContext.drawImage(img, 0, 0, normalWidth, normalHeight);
    }
    else
    {
        canvasContext.drawImage(img, 0, 0, largeWidth, largeHeight);
    }

    displayHotspot();

    /*
    images.on("mousedown", function (e)
    {
        e.preventDefault(); // prevent dragging
    });
    */

    if (!isTopWindow)
    {
        hotspotImageWidth = (hotspotImageWidth*normalWidth)/400;
        hotspotImageHeight = hotspotImageWidth;
    }
    else
    {
        hotspotImageWidth = (hotspotImageWidth*largeWidth)/400;
        hotspotImageHeight = hotspotImageWidth;
    }

    var isMobileBrowser = function()
    {
        var mobileBrowser;
        var userAgent = navigator.userAgent;

        // regex literal, for other user agents, append their name in lower case
        var pattern = new RegExp('android|iphone|ipad|ipod|blackberry|iemobile|webos|opera mini');

        if (pattern.test(userAgent.toLowerCase()))
        {
            mobileBrowser = true;
        }
        else
        {
            mobileBrowser = false;
        }

        return mobileBrowser;
    };

    if (isMobileBrowser() && isTopWindow)
    {
        if (window.innerWidth < window.innerHeight)
        {
            hotspotCanvas.css({"width": "100%"});
            hotspotCanvas.css({"height": "auto"});

            hotspotCanvas.css({"top": "50%"});
            hotspotCanvas.css({"transform": "translateY(-50%)"});
        }
    }

    function colorizeElement(elementId, hexColor)
    {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);

        var r = parseInt(result[1], 16);
        var g = parseInt(result[2], 16);
        var b = parseInt(result[3], 16);

        r /= 255;
        g /= 255;
        b /= 255;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min)
        {
            h = s = 0; // achromatic
        }
        else
        {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max)
            {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        s = s*100;
        s = Math.round(s);
        l = l*100;
        l = Math.round(l);
        h = Math.round(360*h);

        //var colorInHSL = 'hsl(' + h + ', ' + s + ', ' + l + ')';
        //console.log(colorInHSL);

        //sepia hue is 34

        var h1 = h+34-90;
        var s1 = s*5;
        //l = 50;

        document.getElementById(elementId).style.WebkitFilter = "grayscale(100%) brightness("+l+"%) sepia(100%) hue-rotate("+h1+"deg) saturate("+s1+"%) contrast(1.0)";
        document.getElementById(elementId).style.filter = "grayscale(100%) brightness("+l+"%) sepia(100%) hue-rotate("+h1+"deg) saturate("+s1+"%) contrast(1.0)";
    }

    function onOrientationChange()
    {
        if (isMobileBrowser() && !isTopWindow && isInFullscreen())
        {
            if (window.innerWidth > window.innerHeight)
            {
                // landscape

                hotspotCanvas.css({"width": "auto"});
                hotspotCanvas.css({"height": "100%"});

                hotspotCanvas.css({"left": "50%"});
                hotspotCanvas.css({"transform": "translateX(-50%)"});

                hotspotCanvas.css({"top": ""});
                hotspotCanvas.css({"margin": "0px"});
            }
            else
            {
                // portrait

                hotspotCanvas.css({"width": "100%"});
                hotspotCanvas.css({"height": "auto"});

                hotspotCanvas.css({"top": "50%"});
                hotspotCanvas.css({"transform": "translateY(-50%)"});

                hotspotCanvas.css({"left": ""});
            }
        }

        if (isMobileBrowser() && isTopWindow)
        {
            if (window.innerWidth > window.innerHeight)
            {
                // landscape

                hotspotCanvas.css({"width": "auto"});
                hotspotCanvas.css({"height": "100%"});

                hotspotCanvas.css({"left": "50%"});
                hotspotCanvas.css({"transform": "translateX(-50%)"});

                hotspotCanvas.css({"top": ""});
                hotspotCanvas.css({"margin": "0px"});
            }
            else
            {
                // portrait

                hotspotCanvas.css({"width": "100%"});
                hotspotCanvas.css({"height": "auto"});

                hotspotCanvas.css({"top": "50%"});
                hotspotCanvas.css({"transform": "translateY(-50%)"});

                hotspotCanvas.css({"left": ""});
            }
        }
    }

    function leftPad(number, targetLength)
    {
        var output = number + '';

        while (output.length < targetLength)
        {
            output = '0' + output;
        }

        return output;
    }

    if (isMobileBrowser())
    {
        onOrientationChange();
    }

    $(window).on("orientationchange", function()
    {
        if (isMobileBrowser())
        {
            setTimeout(function()
            {
                onOrientationChange();
            }, 500);
        }
    });

    //

    hotspotCanvas.on("mousedown touchstart", function (e)
    {
        e.preventDefault();

        hotspotCanvas.css("cursor", "-webkit-"+cursorActiveName);
        hotspotCanvas.css("cursor", cursorActiveName);

        if (isPlaying)
        {
            wasPlaying = true;
            doPause();
        }
        else
        {
            wasPlaying = false;
        }

        if (e.type === "touchstart")
        {
            var event = e || window.event;
            var touches = event.touches || event.originalEvent.touches;

            if (touches.length === 1)
            {
                currentPositionX = touches[0].pageX;
                currentPositionY = touches[0].pageY;
            }
            else if (touches.length === 2)
            {
                var dx = touches[0].pageX - touches[1].pageX;
                var dy = touches[0].pageY - touches[1].pageY;

                touchZoomDistanceEnd = touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
            }
        }
        else
        {
            currentPositionX = e.pageX;
            currentPositionY = e.pageY;
        }

        var offset = $(this).offset();

        var posRelativeX = e.pageX - offset.left;
        var posRelativeY = e.pageY - offset.top;

        if (e.type === "touchstart")
        {
            posRelativeX = touches[0].pageX - offset.left;
            posRelativeY = touches[0].pageY - offset.top;
        }

        if (isTopWindow)
        {
            var cs = getComputedStyle(hotspotCanvas[0]);
            var widthCanvasTop = parseInt(cs.getPropertyValue('width'), 10);
            var heightCanvasTop = parseInt(cs.getPropertyValue('height'), 10);

            posRelativeX = (posRelativeX * widthCanvasTop) / hotspotCanvas[0].offsetWidth;
            posRelativeY = (posRelativeY * heightCanvasTop) / hotspotCanvas[0].offsetHeight;
        }

        for (var row=0; row<rowsCols.length; row++)
        {
            if (row === currentRow)
            {
                var hotspots = rowsCols[row];

                for (var h=0; h<hotspots.length; h++)
                {
                    var hotspot = hotspots[h];

                    var hotspotRow = hotspot.hotspotRow;
                    var hotspotColumn = hotspot.hotspotColumn;
                    var hotspotPositionX = hotspot.hotspotPositionX;
                    var hotspotPositionY = hotspot.hotspotPositionY;
                    var hotspotType = hotspot.hotspotType;
                    var hotspotImage = hotspot.hotspotImage;
                    var hotspotAction = hotspot.hotspotAction;
                    var hotspotDescription = hotspot.hotspotDescription;

                    if (!isTopWindow)
                    {
                        if (hotspotCanvasElement.offsetWidth < normalWidth)
                        {
                            if (!isInFullscreen())
                            {
                                var cs = getComputedStyle(hotspotCanvas[0]);
                                var widthCanvasTop = parseInt(cs.getPropertyValue('width'), 10);
                                var heightCanvasTop = parseInt(cs.getPropertyValue('height'), 10);
                                
                                hotspotPositionX = hotspotPositionX*widthCanvasTop;
                                hotspotPositionY = hotspotPositionY*heightCanvasTop;
                            }
                        }
                        else
                        {
                            var cs = getComputedStyle(hotspotCanvas[0]);
                            var widthCanvasTop = parseInt(cs.getPropertyValue('width'), 10);
                            var heightCanvasTop = parseInt(cs.getPropertyValue('height'), 10);

                            hotspotPositionX = hotspotPositionX * widthCanvasTop;
                            hotspotPositionY = hotspotPositionY * heightCanvasTop;
                        }
                    }
                    else
                    {
                        var cs = getComputedStyle(hotspotCanvas[0]);
                        var widthCanvasTopElement = parseInt(cs.getPropertyValue('width'), 10);
                        var heightCanvasTopElement = parseInt(cs.getPropertyValue('height'), 10);

                        hotspotPositionX = hotspotPositionX * widthCanvasTopElement;
                        hotspotPositionY = hotspotPositionY * heightCanvasTopElement;
                    }

                    if (hotspotColumn === currentImage)
                    {
                        var xBounds = hotspotPositionX - (hotspotImageWidth/2);
                        var yBounds = hotspotPositionY - (hotspotImageHeight/2);

                        /*if (isInFullscreen())
                        {
                            hotspotPositionX = (hotspotPositionX * hotspotCanvas.width()) / normalWidth;
                            hotspotPositionY = (hotspotPositionY * hotspotCanvas.height()) / normalHeight;

                            xBounds = hotspotPositionX - (hotspotImageWidth/2);
                            yBounds = hotspotPositionY - (hotspotImageHeight/2);
                        }*/

                        /*if (isTopWindow)
                        {
                            var hotspotXTop = (hotspotPositionX * hotspotCanvas.width()) / normalWidth;
                            var hotspotYTop = (hotspotPositionY * hotspotCanvas.height()) / normalHeight;

                            xBounds = hotspotXTop - (hotspotImageWidth/2);
                            yBounds = hotspotYTop - (hotspotImageHeight/2);

                            if (isInFullscreen())
                            {
                                xBounds = hotspotPositionX - (hotspotImageWidth/2);
                                yBounds = hotspotPositionY - (hotspotImageHeight/2);
                            }
                        }*/

                        var widthBounds = xBounds + hotspotImageWidth;
                        var heightBounds = yBounds + hotspotImageHeight;

                        if (((posRelativeX >= xBounds) && (posRelativeY >= yBounds)) && ((posRelativeX <= widthBounds) && (posRelativeY <= heightBounds)))
                        {
                            switch (hotspotType)
                            {
                            case 0:
                                break;

                            case 1:
                                var wndw = window.open(hotspotAction, "_blank");

                                if (wndw)
                                {
                                    wndw.focus();
                                }
                                else
                                {
                                    alert("Please allow popups");
                                }

                                break;

                            case 2:
                                eval(hotspotAction[0]);

                                break;

                            case 3:

                                var hotspotImagePath = "hotspotimg/" + hotspotAction;

                                var img = new Image();
                                img.onload = function()
                                {
                                    hotspotsImageWidth = this.width;
                                    hotspotsImageHeight = this.height;

                                    doZoom(true, hotspotAction, hotspotDescription, false);

                                    if (!mouseZoom)
                                    {
                                        $('.zoomdivclose').remove();

                                        zoomDivClose = document.createElement('div');
                                        zoomDivClose.id = 'zoomdivclose';
                                        zoomDivClose.classList.add("zoomdivclose");

                                        var hotspotImageZoomButton = $(zoomDivClose);
                                        hotspotImageZoomButton.on("mousedown touchstart", function (e)
                                        {
                                            exitZoom(true);
                                            topContainerElement.removeChild(zoomDivClose);
                                        });

                                        zoomDivCloseDescription = document.createElement('p');
                                        zoomDivCloseDescription.id = 'zoomdivclose-desc';
                                        zoomDivCloseDescription.innerHTML = hotspotDescription;

                                        zoomDivCloseContainer = document.createElement('div');
                                        zoomDivCloseContainer.id = 'zoomdivclose-container';

                                        zoomDivCloseContainer.appendChild(zoomDivCloseDescription);
                                        zoomDivClose.appendChild(zoomDivCloseContainer);
                                        topContainerElement.appendChild(zoomDivClose);
                                    }
                                };

                                img.src = hotspotImagePath;

                                break;

                            default:
                                break;
                            }

                            break;
                        }
                    }
                }
            }
        }


        isClicked = true;
        return false;
    });

    hotspotCanvas.on("mouseup touchend", function ()
    {
        hotspotCanvas.css("cursor", "-webkit-"+cursorHoverName);
        hotspotCanvas.css("cursor", cursorHoverName);

        if (isClicked && !isPlaying)
        {
            isClicked = false;
			
			if (isBlendingEnabled)
            {
                opacity = 1;
                canvasContext.globalAlpha = 1;
                fade1();
            }

            if (isSingleRotation)
            {
                doPause();
            }
            else
            {
                if (wasPlaying)
                {
                    doPlay();
                }
                else
                {
                    doPause();
                }
            }
        }

        if (!isRotationAfterMouseControl)
        {
            doPause();
        }
    });

    hotspotCanvas.mouseout(function()
    {
        hotspotCanvas.css("cursor", "-webkit-"+cursorHoverName);
        hotspotCanvas.css("cursor", cursorHoverName);

        if (isClicked && !isPlaying)
        {
            isClicked = false;
			
			if (isBlendingEnabled)
            {
                opacity = 1;
                canvasContext.globalAlpha = 1;
                fade1();
            }

            if (isSingleRotation)
            {
                doPause();
            }
            else
            {
                if (wasPlaying)
                {
                    doPlay();
                }
                else
                {
                    doPause();
                }
            }
        }
    });

    hotspotCanvas.on("mousemove touchmove", function (e)
    {
        var offset = $(this).offset();

        var posRelativeX = e.pageX - offset.left;
        var posRelativeY = e.pageY - offset.top;

        if (e.type === "touchmove")
        {
            var eventTouch = e || window.event;
            var touchesEv = eventTouch.touches || eventTouch.originalEvent.touches;

            posRelativeX = touchesEv[0].pageX - offset.left;
            posRelativeY = touchesEv[0].pageY - offset.top;
        }

        mouse.x = posRelativeX;
        mouse.y = posRelativeY;

        for (var row=0; row<rowsCols.length; row++)
        {
            if (row === currentRow)
            {
                var hotspots = rowsCols[row];

                for (var h=0; h<hotspots.length; h++)
                {
                    var hotspot = hotspots[h];

                    var hotspotRow = hotspot.hotspotRow;
                    var hotspotColumn = hotspot.hotspotColumn;
                    var hotspotPositionX = hotspot.hotspotPositionX;
                    var hotspotPositionY = hotspot.hotspotPositionY;
                    var hotspotPositionTitleX = hotspot.hotspotPositionX;
                    var hotspotPositionTitleY = hotspot.hotspotPositionY;
                    var hotspotType = hotspot.hotspotType;
                    var hotspotImage = hotspot.hotspotImage;
                    var hotspotTitle = hotspot.hotspotTitle;

                    if (!isTopWindow)
                    {
                        if (hotspotCanvasElement.offsetWidth < normalWidth)
                        {
                            if (!isInFullscreen())
                            {
                                var cs = getComputedStyle(hotspotCanvas[0]);
                                var widthCanvasTop = parseInt(cs.getPropertyValue('width'), 10);
                                var heightCanvasTop = parseInt(cs.getPropertyValue('height'), 10);
                                
                                hotspotPositionX = hotspotPositionX*widthCanvasTop;
                                hotspotPositionY = hotspotPositionY*heightCanvasTop;
                            }
                        }
                        else
                        {
                            var cs = getComputedStyle(hotspotCanvas[0]);
                            var widthCanvasTop = parseInt(cs.getPropertyValue('width'), 10);
                            var heightCanvasTop = parseInt(cs.getPropertyValue('height'), 10);

                            hotspotPositionX = hotspotPositionX * widthCanvasTop;
                            hotspotPositionY = hotspotPositionY * heightCanvasTop;

                            //hotspotPositionTitleX = hotspotPositionTitleX * widthCanvasTop;
                            //hotspotPositionTitleY = hotspotPositionTitleY * heightCanvasTop;
                        }
                    }
                    else
                    {

                        var cs = getComputedStyle(hotspotCanvas[0]);
                        var widthCanvasTop = parseInt(cs.getPropertyValue('width'), 10);
                        var heightCanvasTop = parseInt(cs.getPropertyValue('height'), 10);

                        hotspotPositionX = hotspotPositionX * widthCanvasTop;
                        hotspotPositionY = hotspotPositionY * heightCanvasTop;

                        //hotspotPositionTitleX = hotspotPositionTitleX * widthCanvasTop;
                        //hotspotPositionTitleY = hotspotPositionTitleY * heightCanvasTop;
                    }

                    if (hotspotColumn === currentImage)
                    {
                        var xBounds = hotspotPositionX - (hotspotImageWidth/2);
                        var yBounds = hotspotPositionY - (hotspotImageHeight/2);

                        /*if (isInFullscreen())
                        {
                            hotspotPositionX = (hotspotPositionX * hotspotCanvas.width()) / normalWidth;
                            hotspotPositionY = (hotspotPositionY * hotspotCanvas.height()) / normalHeight;

                            xBounds = hotspotPositionX - (hotspotImageWidth/2);
                            yBounds = hotspotPositionY - (hotspotImageHeight/2);
                        }*/

                        /*
                        if (isTopWindow)
                        {
                            var hotspotXTop = (hotspotPositionX * hotspotCanvas.width()) / normalWidth;
                            var hotspotYTop = (hotspotPositionY * hotspotCanvas.height()) / normalHeight;

                            xBounds = hotspotXTop - (hotspotImageWidth/2);
                            yBounds = hotspotYTop - (hotspotImageHeight/2);

                            if (isInFullscreen())
                            {
                                xBounds = hotspotPositionX - (hotspotImageWidth/2);
                                yBounds = hotspotPositionY - (hotspotImageHeight/2);
                            }
                        }
                        */

                        var widthBounds = xBounds + hotspotImageWidth;
                        var heightBounds = yBounds + hotspotImageHeight;

                        if (((posRelativeX >= xBounds) && (posRelativeY >= yBounds)) && ((posRelativeX <= widthBounds) && (posRelativeY <= heightBounds)))
                        {
                            hotspotCanvas.css("cursor", "pointer");

                            /*if (isTopWindow)
                            {
                                hotspotPositionTitleX = (hotspotPositionTitleX * largeWidth) / normalWidth;
                                hotspotPositionTitleY = (hotspotPositionTitleY * largeHeight) / normalHeight;
                            }*/

                            var cs = getComputedStyle(hotspotCanvas[0]);
                            var widthCanvasTop = parseInt(cs.getPropertyValue('width'), 10);
                            var heightCanvasTop = parseInt(cs.getPropertyValue('height'), 10);

                            if (isTopWindow)
                            {
                                hotspotPositionTitleX = hotspotPositionTitleX * largeWidth;
                                hotspotPositionTitleY = hotspotPositionTitleY * largeHeight;
                            }
                            else
                            {
                                hotspotPositionTitleX = hotspotPositionTitleX * normalWidth;
                                hotspotPositionTitleY = hotspotPositionTitleY * normalHeight;
                            }

                            displayHotspotTitleText(hotspotTitle, hotspotPositionTitleX, hotspotPositionTitleY);

                            break;
                        }
                        else
                        {
                            hotspotCanvas.css("cursor", "-webkit-"+cursorHoverName);
                            hotspotCanvas.css("cursor", cursorHoverName);

                            displayHotspot();
                        }
                    }
                }
            }
        }

        if (isClicked)
        {
            var xPosition;
            var yPosition;

            hotspotCanvas.css("cursor", "-webkit-"+cursorActiveName);
            hotspotCanvas.css("cursor", cursorActiveName);

            if (e.type === "touchmove")
            {
                e.preventDefault();

                var event = e || window.event;
                var touches = event.touches || event.originalEvent.touches;

                if (touches.length === 1)
                {
                    xPosition = touches[0].pageX;
                    yPosition = touches[0].pageY;
                }
                else if (touches.length === 2)
                {
                    var dx = touches[0].pageX - touches[1].pageX;
                    var dy = touches[0].pageY - touches[1].pageY;

                    touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

                    var factor = touchZoomDistanceStart / touchZoomDistanceEnd;
                    touchZoomDistanceStart = touchZoomDistanceEnd;

                    if (touchZoomDistanceEnd > zoomTouchDistanceOld)
                    {
                        valueZoom += stepPinchZoom;
                        valueZoom = (valueZoom>maxZoom) ? maxZoom : valueZoom;
                    }
                    else
                    {
                        valueZoom -= stepPinchZoom;
                        valueZoom = (valueZoom<minZoom) ? minZoom : valueZoom;
                    }

                    if (valueZoom <= maxZoom && valueZoom >= minZoom)
                    {
                        //document.getElementById("log").innerHTML = valueZoom;
                        doZoom(false, "", "", false);
                    }

                    if (valueZoom < 1.1)
                    {
                        exitZoom(false);
                    }

                    zoomTouchDistanceOld = touchZoomDistanceEnd;
                }
            }
            else
            {
                xPosition = e.pageX;
                yPosition = e.pageY;
            }

            if (!isInertiaEnabled)
            {
                if (Math.abs(currentPositionX - xPosition) >= sensitivity)
                {
                    if (currentPositionX - xPosition >= sensitivity)
                    {
                        if (isPointerDragNormal)
                        {
                            displayPreviousFrame();
                        }
                        else
                        {
                            displayNextFrame();
                        }
                    }
                    else
                    {
                        if (isPointerDragNormal)
                        {
                            displayNextFrame();
                        }
                        else
                        {
                            displayPreviousFrame();
                        }
                    }

                    currentPositionX = xPosition;
                }
            }
        }

        if ( (numberOfRows > 1) && (Math.abs(currentPositionY - yPosition) >= (sensitivityVertical * 10)))
        {
            if (currentPositionY - yPosition >= (sensitivityVertical * 10))
            {
                if (isPointerDragNormal)
                {
                    console.log("down");

                    currentRow--;

                    if (currentRow < 0)
                    {
                        currentRow = 0;
                    }

                    displayRowFrame();
                }
                else
                {
                    currentRow++;

                    if (currentRow > (numberOfRows-1))
                    {
                        currentRow = numberOfRows-1;
                    }

                    console.log("up");
                    displayRowFrame();
                }
            }
            else
            {
                if (isPointerDragNormal)
                {
                    currentRow++;

                    if (currentRow > (numberOfRows-1))
                    {
                        currentRow = numberOfRows-1;
                    }

                    //console.log("up");
                    displayRowFrame();
                }
                else
                {
                    currentRow--;

                    if (currentRow < 0)
                    {
                        currentRow = 0;
                    }

                    //console.log("down");
                    displayRowFrame();
                }
            }

            currentPositionY = yPosition;
        }
    });

    hotspotCanvas.on("wheel", function(e)
    {
        if (mouseZoom)
        {
            var delta = e.delta || e.originalEvent.wheelDelta;
            var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;

            if (zoomOut)
            {
                if (isPlaying)
                {
                    doPause();
                }

                if (!isZooming)
                {
                    zoomIn.removeClass("zoomin");
                    zoomIn.addClass("zoomout");

                    //valueZoom = maxZoom;
                    doZoom(false, "", "", true);
                }
            }
        }
    });

    if (document.getElementById("play"))
    {
        if (isColorizeEnabled)
        {
            colorizeElement("play", colorizeColor);
        }

        document.getElementById("play").addEventListener('click', function(e)
        {
            if (isBlendingEnabled)
            {
                opacity = 1;
                canvasContext.globalAlpha = 1;
                fade1();
            }

            if (!isPlaying)
            {
                doPlay();
            }
            else
            {
                doPause();
            }
        }, false);
    }

    if (document.getElementById("prev"))
    {
        if (isColorizeEnabled)
        {
            colorizeElement("prev", colorizeColor);
        }

        document.getElementById("prev").addEventListener('click', function(e)
        {
            displayPreviousFrame();

            if (isBlendingEnabled)
            {
                opacity = 1;
                canvasContext.globalAlpha = 1;
                fade1();
            }

            if (isPlaying)
            {
                doPause();
            }

        }, false);
    }

    if (document.getElementById("next"))
    {
        if (isColorizeEnabled)
        {
            colorizeElement("next", colorizeColor);
        }

        document.getElementById("next").addEventListener('click', function(e)
        {
            displayNextFrame();

            if (isBlendingEnabled)
            {
                opacity = 1;
                canvasContext.globalAlpha = 1;
                fade1();
            }

            if (isPlaying)
            {
                doPause();
            }

        }, false);
    }

    if (document.getElementById("zoomin"))
    {
        if (isColorizeEnabled)
        {
            colorizeElement("zoomin", colorizeColor);
        }

        document.getElementById("zoomin").addEventListener('click', function(e)
        {
            if (isBlendingEnabled)
            {
                opacity = 1;
                canvasContext.globalAlpha = 1;
                fade1();
            }

            if (isPlaying)
            {
                doPause();
            }

            if (!isZooming)
            {
                zoomIn.removeClass("zoomin");
                zoomIn.addClass("zoomout");

                //valueZoom = maxZoom;
                doZoom(false, "", "", false);
            }
            else
            {
                zoomIn.removeClass("zoomout");
                zoomIn.addClass("zoomin");

                //valueZoom = minZoom;
                exitZoom(false);
            }
        }, false);
    }

    if (document.getElementById("fullscreen"))
    {
        if (isColorizeEnabled)
        {
            colorizeElement("fullscreen", colorizeColor);
        }

        document.getElementById("fullscreen").addEventListener('click', function(e)
        {
            if (screenfull.isEnabled)
            {
                var topContainerElem = topContainer[0];
                screenfull.toggle(topContainerElem);
            }
        }, false);
    }

    document.addEventListener("fullscreenchange", function()
    {
        if (isMobileBrowser())
        {
            onFullscreenChangeEvent();
        }
    });

    document.addEventListener("mozfullscreenchange", function()
    {
        if (isMobileBrowser())
        {
            onFullscreenChangeEvent();
        }
    });

    document.addEventListener("webkitfullscreenchange", function()
    {
        if (isMobileBrowser())
        {
            onFullscreenChangeEvent();
        }
    });

    document.addEventListener("msfullscreenchange", function()
    {
        if (isMobileBrowser())
        {
            onFullscreenChangeEvent();
        }
    });

    function onFullscreenChangeEvent()
    {
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;

        if (isInFullscreen())
        {
            //console.log("1");

            if (window.innerWidth > window.innerHeight)
            {
                // landscape

                hotspotCanvas.css({"width": "auto"});
                hotspotCanvas.css({"height": "100%"});

                hotspotCanvas.css({"left": "50%"});
                hotspotCanvas.css({"transform": "translateX(-50%)"});

                /*if (isMobileBrowser())
                {
                    for (var i=0; i<imagesCount; i++)
                    {
                        images.eq(i).css({"width": "auto"});
                        images.eq(i).css({"height": "100%"});
                    }
                }*/
            }
            else
            {
                // portrait

                hotspotCanvas.css({"width": "100%"});
                hotspotCanvas.css({"height": "auto"});

                hotspotCanvas.css({"top": "50%"});
                hotspotCanvas.css({"transform": "translateY(-50%)"});
            }

            //

            if (isMobileBrowser())
            {
                setTimeout(function()
                {
                    onOrientationChange();
                }, 500);
            }
        }
    }

    function isInFullscreen()
    {
        return screenfull.isFullscreen;
    }

    function doZoom(hotspot, imageName, description, wheel)
    {
        isZooming = true;

        zoomIn.removeClass("zoomin");
        zoomIn.addClass("zoomout");

        doPause();

        valueZoom = Math.round(valueZoom*10)/10;

        var multiRowFileName = $(multiRowArray[currentRow][currentImage]).attr("src").split("/").pop();

        if (deepZoom === 1)
        {
            if (isTopWindow)
            {
                //var largeImageSrc = images.eq(currentImage).attr("src");
                //var largeImageLastSeparator = largeImageSrc.lastIndexOf("/");
                //var largeImageFilename = largeImageSrc.substring(largeImageLastSeparator+1);

                //console.log(largeImageFilename);
                //draggableContainer.css("background-image", "url(imglarge/" + multiRowFileName + ")");
                //zoomImage.src =  "imglarge/" + multiRowFileName;
                zoomImage.attr("src", "imglarge/" + multiRowFileName);
            }
            else
            {
                //draggableContainer.css("background-image", "url(imglarge/" + multiRowFileName + ")");
                //zoomImage.src =  "imglarge/" + multiRowFileName;
                zoomImage.attr("src", "imglarge/" + multiRowFileName);
            }
        }
        else
        {
            //draggableContainer.css("background-image", "url(img/" + multiRowFileName + ")");
            //zoomImage.src =  "img/" + multiRowFileName;
            zoomImage.attr("src", "img/" + multiRowFileName);
        }

        if (hotspot)
        {
            zoomImage.attr("src", "hotspotimg/" + imageName);
        }

        //draggableContainer.css("background-repeat", "no-repeat");
        //draggableContainer.css("background-position", zoomBackgroundPosition);
        //draggableContainer.draggable();
        zoomImage.css("display", "block");
        zoomPanel.css("display", "block");
        imageContainer.css("display", "none");
        hotspotCanvas.css("visibility", "hidden");
        playPauseControl.css("visibility", "hidden");
        prevControl.css("visibility", "hidden");
        nextControl.css("visibility", "hidden");

        if (hotspot)
        {
            zoomIn.css("visibility", "hidden");
        }

        //
        //

        (function()
        {
            var $section = $('#inverted-contain');

            $panzoom = $section.find('.panzoom').panzoom({
                                                             startTransform: 'scale(' + 1.0 + ')',
                                                             //increment: 0.1,
                                                             //rangeStep: 0.1,
                                                             minScale: 1.0,
                                                             maxScale: maxZoom,
                                                             contain: 'invert'
                                                         }).panzoom();

            if (hotspot)
            {
                $panzoom.panzoom('zoom', parseFloat(1.0),
                                 {
                                     animate: false,
                                     //focal: e
                                 });

                $('.zoomdivclose').remove();

                zoomDivClose = document.createElement('div');
                zoomDivClose.id = 'zoomdivclose';
                zoomDivClose.classList.add("zoomdivclose");

                var hotspotImageZoomButton = $(zoomDivClose);
                hotspotImageZoomButton.on("mousedown touchstart", function (e)
                {
                    exitZoom(true);
                    topContainerElement.removeChild(zoomDivClose);
                });

                zoomDivCloseDescription = document.createElement('p');
                zoomDivCloseDescription.id = 'zoomdivclose-desc';
                zoomDivCloseDescription.innerHTML = description;

                zoomDivCloseContainer = document.createElement('div');
                zoomDivCloseContainer.id = 'zoomdivclose-container';

                zoomDivCloseContainer.appendChild(zoomDivCloseDescription);
                zoomDivClose.appendChild(zoomDivCloseContainer);
                topContainerElement.appendChild(zoomDivClose);

                if (hotspot)
                {
                    if (!isTopWindow)
                    {
                        if (hotspotsImageWidth > hotspotsImageHeight)
                        {
                            zoomImage.css({"width": "100%"});
                            zoomImage.css({"height": "auto"});

                            zoomImage.css({"top": "50%"});
                            zoomImage.css({"transform": "translate(-50%, -50%)"});
                        }
                        else
                        {
                            zoomImage.css({"width": "auto"});
                            zoomImage.css({"height": "100%"});
                        }
                    }
                }
            }
            else
            {
                if (wheel)
                {
                    valueZoom = 1.0;

                    /*$panzoom = $section.find('.panzoom').panzoom({
                                                                     startTransform: 'scale(' + 1.0 + ')',
                                                                     //increment: 0.1,
                                                                     //rangeStep: 0.1,
                                                                     minScale: 1.0,
                                                                     maxScale: maxZoom,
                                                                     contain: 'invert'
                                                                 }).panzoom();*/

                    $panzoom.panzoom('zoom', parseFloat(valueZoom),
                                     {
                                         animate: false,
                                         //focal: e
                                     });
                }
                else
                {
                    valueZoom = maxZoom;

                    /*$panzoom = $section.find('.panzoom').panzoom({
                                                                     startTransform: 'scale(' + maxZoom + ')',
                                                                     //increment: 0.1,
                                                                     //rangeStep: 0.1,
                                                                     minScale: 1.0,
                                                                     maxScale: maxZoom,
                                                                     contain: 'invert'
                                                                 }).panzoom();*/

                    $panzoom.panzoom('zoom', parseFloat(maxZoom),
                                     {
                                         animate: false,
                                         //focal: e
                                     });
                }

                if (mouseZoom)
                {
                    $panzoom.parent().on('mousewheel.focal', function( e )
                    {
                        e.preventDefault();

                        var delta = e.delta || e.originalEvent.wheelDelta;
                        var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;

                        if (zoomOut)
                        {
                            //scroll down
                            valueZoom += stepZoom;
                            valueZoom = (valueZoom>maxZoom) ? maxZoom : valueZoom;
                        }
                        else
                        {
                            //scroll up
                            valueZoom -= stepZoom;
                            valueZoom = (valueZoom<minZoom) ? minZoom : valueZoom;
                        }

                        if (valueZoom <= minZoom)
                        {
                            zoomIn.removeClass("zoomout");
                            zoomIn.addClass("zoomin");

                            //valueZoom = minZoom;
                            exitZoom(false);
                        }

                        if ((valueZoom >= minZoom) && (valueZoom < maxZoom))
                        {
                            $panzoom.panzoom('zoom', parseFloat(valueZoom),
                                             {
                                                 animate: false,
                                                 focal: e
                                             });
                        }

                    });
                }
            }

        })();
    }

    function exitZoom(hotspot)
    {
        isZooming = false;

        zoomIn.removeClass("zoomout");
        zoomIn.addClass("zoomin");

        zoomImage.attr("src", "#");
        zoomImage.css("display", "none");

        imageContainer.css("display", "block");
        hotspotCanvas.css("visibility", "visible");
        playPauseControl.css("visibility", "visible");
        prevControl.css("visibility", "visible");
        nextControl.css("visibility", "visible");

        if (hotspot)
        {
            zoomIn.css("visibility", "visible");
        }


        zoomPanel.css("display", "none");

        hotspotCanvas.css("cursor", "-webkit-"+cursorHoverName);
        hotspotCanvas.css("cursor", cursorHoverName);

        isFirstDrag = true;
    }

    var displayPreviousFrame = function()
    {
        if (isBouncing && isSingleRotation && (bounceRotationCount === 2) && !isBouncingFinished)
        {
            //console.log("finished");
            isBouncingFinished = true;
            //clearInterval(animation);

            doPause();

            return;
        }

        currentImage++;

        if (currentImage >= (imagesCount/numberOfRows))
        {
            if (isBouncing && !isPlaying)
            {
                currentImage = (imagesCount/numberOfRows)-1;
            }
            else
            {
                currentImage = 0;
            }
        }

        if ((currentImage == ((imagesCount/numberOfRows)-1)) && isSingleRotation && !isBouncing)
        {
            playPauseControl.attr("class", "play");
            isPlaying = false;

            clearInterval(animation);
        }

        if ((currentImage == ((imagesCount/numberOfRows)-1)) && isBouncing && !isBouncingFinished)
        {
            if (isSingleRotation)
            {
                bounceRotationCount++;
            }

            if (isPlaying)
            {
                clearInterval(animation);
                animation = setInterval(displayNextFrame, playSpeed);
            }
        }

        if (!isBlendingEnabled)
        {
            var img = multiRowArray[currentRow][currentImage];

            if (!isTopWindow)
            {
                canvasContext.drawImage(img, 0, 0, normalWidth, normalHeight);
            }
            else
            {
                canvasContext.drawImage(img, 0, 0, largeWidth, largeHeight);
            }

            displayHotspot();
        }
        else
        {
            fade1();
        }

        previousImage = currentImage;
    };

    var displayNextFrame = function()
    {
        if (isBouncing && isSingleRotation && (bounceRotationCount === 2) && !isBouncingFinished)
        {
            //console.log("finished");
            isBouncingFinished = true;
            //clearInterval(animation);

            doPause();

            return;
        }

        currentImage--;

        if (currentImage < 0)
        {
            if (isBouncing && !isPlaying)
            {
                currentImage = 0;
            }
            else
            {
                currentImage = (imagesCount/numberOfRows)-1;
            }
        }

        if ((currentImage == 0) && isSingleRotation && !isBouncing)
        {
            playPauseControl.attr("class", "play");
            isPlaying = false;

            clearInterval(animation);
        }

        if ((currentImage == 0) && isBouncing && !isBouncingFinished)
        {
            if (isSingleRotation)
            {
                bounceRotationCount++;
            }

            if (isPlaying)
            {
                clearInterval(animation);
                animation = setInterval(displayPreviousFrame, playSpeed);
            }
        }

        if (!isBlendingEnabled)
        {
            var img = multiRowArray[currentRow][currentImage];

            if (!isTopWindow)
            {
                canvasContext.drawImage(img, 0, 0, normalWidth, normalHeight);
            }
            else
            {
                canvasContext.drawImage(img, 0, 0, largeWidth, largeHeight);
            }

            displayHotspot();

        }
        else
        {
            fade1();
        }

        previousImage = currentImage;
    };

    var displayRowFrame = function()
    {
        if (!isBlendingEnabled)
        {

            var img = multiRowArray[currentRow][currentImage];

            if (!isTopWindow)
            {
                canvasContext.drawImage(img, 0, 0, normalWidth, normalHeight);
            }
            else
            {
                canvasContext.drawImage(img, 0, 0, largeWidth, largeHeight);
            }

            displayHotspot();

        }
        else
        {
            fade1();
        }
    };

    function fade1()
    {
        window.requestAnimationFrame(fade1);

        now = Date.now();
        delta = now - then;

        if (delta > interval)
        {
            then = now - (delta % interval);

            //

            opacity -= 0.05;

            if (opacity <= 0)
            {
                opacity = 0;
            }

            var img = multiRowArray[currentRow][currentImage];

            canvasContext.globalAlpha -= 0.05;

            if (canvasContext.globalAlpha <= 0)
            {
                canvasContext.globalAlpha = 0;
            }
			
			if (!isPlaying && !isClicked)
            {
                opacity = 1;
                canvasContext.globalAlpha = 1;
            }

            if (!isTopWindow)
            {
                if (!isPlaying && !isClicked)
                {
                    canvasContext.clearRect(0, 0, normalWidth, normalHeight);
                }

                canvasContext.drawImage(img, 0, 0, normalWidth, normalHeight);
            }
            else
            {
                if (!isPlaying && !isClicked)
                {
                    canvasContext.clearRect(0, 0, largeWidth, largeHeight);
                }

                canvasContext.drawImage(img, 0, 0, largeWidth, largeHeight);
            }

            displayHotspot();
        }
    }

    function roundRect(ctx, x, y, width, height, radius, fill, stroke)
    {
        if (typeof stroke == "undefined" ) {
            stroke = true;
        }
        if (typeof radius === "undefined") {
            radius = 5;
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (stroke) {
            ctx.stroke();
        }
        if (fill) {
            ctx.fill();
        }
    }

    function displayHotspotTitleText(titleText, titlePositionX, titlePositionY)
    {
        canvas = document.getElementById("hotspotcanvas");
        var context = canvas.getContext("2d");

        //context.clearRect(0, 0, canvas.width, canvas.height);

        displayHotspot();

        var fontsize = hotspotImageWidth/2;
        var fontface = 'verdana';
        var lineHeight = fontsize * 1.286;
        var lineAscent = lineHeight - fontsize;
        var textHeight = lineHeight - lineAscent;
        var lineDescent = lineHeight - lineAscent;

        var x = titlePositionX+hotspotImageWidth;
        var y = titlePositionY-(lineHeight/2);

        context.font = fontsize + 'px ' + fontface;
        var textWidth = context.measureText(titleText).width;

        context.textAlign = 'left';
        context.textBaseline = 'top';

        context.fillStyle = "rgba(160, 160, 160, 0.65)";
        context.strokeStyle = "rgba(0, 0, 0, 1.0)";
        roundRect(context, x-4, y-4, textWidth+8, lineHeight+8, 4, true);

        context.fillStyle="#000000";
        context.fillText(titleText, x, y);
    }

    function displayHotspot()
    {
        if (rowsCols !== "undefined")
        {
            canvas = document.getElementById("hotspotcanvas");

            /*
            if (!isTopWindow)
            {
                canvas.width = normalWidth;
                canvas.height = normalHeight;
            }
            else
            {
                canvas.width = largeWidth;
                canvas.height = largeHeight;
            }
            */

            var context = canvas.getContext("2d");
            //context.clearRect(0, 0, canvas.width, canvas.height);

            var img = multiRowArray[currentRow][currentImage];

            if (!isTopWindow)
            {
                canvasContext.drawImage(img, 0, 0, normalWidth, normalHeight);
            }
            else
            {
                canvasContext.drawImage(img, 0, 0, largeWidth, largeHeight);
            }

            for (var row=0; row<rowsCols.length; row++)
            {
                if (row === currentRow)
                {
                    var hotspots = rowsCols[row];

                    for (var h=0; h<hotspots.length; h++)
                    {
                        var hotspot = hotspots[h];

                        var hotspotRow = hotspot.hotspotRow;
                        var hotspotColumn = hotspot.hotspotColumn;
                        var hotspotPositionX = hotspot.hotspotPositionX;
                        var hotspotPositionY = hotspot.hotspotPositionY;
                        var hotspotType = hotspot.hotspotType;
                        var hotspotImage = hotspot.hotspotImage;

                        if (hotspotColumn === currentImage)
                        {
                            var img = new Image();
                            img.src = hotspotImage;

                            if (!isTopWindow)
                            {
                                hotspotPositionX = hotspotPositionX * normalWidth;
                                hotspotPositionY = hotspotPositionY * normalHeight;
                            }
                            else
                            {
                                hotspotPositionX = hotspotPositionX * largeWidth;
                                hotspotPositionY = hotspotPositionY * largeHeight;
                            }

                            context.drawImage(img, hotspotPositionX-(hotspotImageWidth/2), hotspotPositionY-(hotspotImageHeight/2), hotspotImageWidth, hotspotImageHeight);
                        }
                    }
                }
            }
        }
    }

    function step()
    {
        if (isInertiaEnabled)
        {
            requestAnimationFrame(step);

            if (isClicked)
            {
                previous.x = position.x;
                previous.y = position.y;

                position.x = mouse.x;
                position.y = mouse.y;

                velocity.x = ( position.x - previous.x );
                velocity.y = ( position.y - previous.y );

            }
            else
            {

                position.x += velocity.x;
                position.y += velocity.y;

                velocity.x *= friction;
                velocity.y *= friction;
            }

            if (Math.abs(currentPositionX - position.x) >= sensitivity)
            {
                if (currentPositionX - position.x >= sensitivity)
                {
                    if (isPointerDragNormal)
                    {
                        displayPreviousFrame();
                    }
                    else
                    {
                        displayNextFrame();
                    }
                }
                else
                {
                    if (isPointerDragNormal)
                    {
                        displayNextFrame();
                    }
                    else
                    {
                        displayPreviousFrame();
                    }
                }

                currentPositionX = position.x;
            }
        }
    }

    var doPlay = function()
    {
        playPauseControl.attr("class", "pause");
        isPlaying = true;

        if (isRotationDirectionNormal)
        {
            animation = setInterval(displayNextFrame, playSpeed);
        }
        else
        {
            animation = setInterval(displayPreviousFrame, playSpeed);
        }
    }

    var doPause = function()
    {
        playPauseControl.attr("class", "play");
        isPlaying = false;

        if (isBouncing)
        {
            bounceRotationCount = 0;
            isBouncingFinished = false;
        }

        clearInterval(animation);
    }

    if (isPlaying)
    {
        clearInterval(animation);
        doPlay();
    }

    step();
}
