<p align="center">
    <a href="https://github.com/AntoninoBonanno/DragDropAnnotate/releases"><img src="https://img.shields.io/github/v/release/AntoninoBonanno/DragDropAnnotate?label=Latest%20release" alt="Latest release"></a>
</p>

jQuery plugin to annotate images easily with drag and drop.

**DragDropAnnotate** is a lightweight image annotation tool that make it easy to add custom markers, comments, hotspots to images via drag and drop.

Supports rectangle, and image annotations. The drag and drop functionality based on jQuery UI draggable widget.

<p align="center"><img src="https://raw.githubusercontent.com/AntoninoBonanno/DragDropAnnotate/master/DragDropAnnotate.png" data-canonical-src="https://raw.githubusercontent.com/AntoninoBonanno/DragDropAnnotate/master/DragDropAnnotate.png" width="600" height="400" /></p>

### More Features
* Quick annotations via drag and drop.
* Annotate an image with another image or bounding box.
* Hint messages on mouse hover.
* Popup window showing descriptions and tools of the annotation.
* Custom annotation styles.
* Allows to edit, move, rotate and delete the annotation with mouse and touch.
* Support touch devices

<h3 style="text-align:center"><a href="https://antoninobonanno.github.io/DragDropAnnotate/example/index.html">Play Demo</a></h3>

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/C0C46QJ0M)

## Instructions

### Imports
```
<!-- jQuery -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" crossorigin="anonymous"></script>

<!-- Fontawesome -->
<link rel="stylesheet" href="./vendor/fontawesome-free-5.12.1-web/css/all.min.css" type="text/css" />

<!-- DragDropAnnotate -->
<link rel="stylesheet" href="./src/dragDropAnnotate.css" type="text/css" />
<script src="./src/dragDropAnnotate.js"></script>
```

### Initialize annotable item (droppable)

```
<img id="imageExample" src="example.jpg">
var annotable = $("#imageExample").annotable();  
```
### Initialize annotation item (draggable)

Annotation with image

```
<img class="draggable-annotation" src="example.jpg" annotation-text="example" />
```

Simple Annotation

```
<div class="draggable-annotation" annotation-text="example" annotation-width="200" annotation-height="400"> Example </div>
```

## More details
[View on GitHub](https://github.com/AntoninoBonanno/DragDropAnnotate)
