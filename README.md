# DragDrop Annotate

jQuery plugin to annotate images easily with drag and drop.

**DragDropAnnotate** is a lightweight image annotation tool that make it easy to add custom markers, comments, hotspots to images via drag and drop.

Supports rectangle, and image annotations. The drag and drop functionality based on jQuery UI draggable widget.

<p align="center"><img src="https://raw.githubusercontent.com/AntoninoBonanno/DragDropAnnotate/master/DragDropAnnotate.png" data-canonical-src="https://raw.githubusercontent.com/AntoninoBonanno/DragDropAnnotate/master/DragDropAnnotate.png" width="600" height="400" /></p>

### More Features
* Hint messages on mouse hover.
* Popup window showing descriptions and tools of the annotation.
* Custom annotation styles.
* Allows to move and rotate the annotaion with mouse and touch.
* Support touch devices

[Official Page](https://antoninobonanno.github.io/DragDropAnnotate) - [Demo](https://antoninobonanno.github.io/DragDropAnnotate/example/index.html)

Are you looking for an image annotation toolkit (not drag and drop) written in JavaScript? Check out [this project](https://github.com/AntoninoBonanno/annotorious).

## Dependencies

* [jQuery](https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js) >= 1.8.2
* [jQuery UI](https://code.jquery.com/ui/1.12.1/jquery-ui.min.js)
* [Fontawesome](https://fontawesome.com/) (Optional - you can change the icons)

## Usage

To set up **DragDropAnnotate** on a Web page, add this code to your page head:

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

## Initialize annotable item (droppable)

```
<img id="imageExample" src="example.jpg">
```

In its simplest case, **DragDropAnnotate** can be initialised with a single line of Javascript:

```
var annotable = $("#imageExample").annotable();   
```

Or use optional configuration parameters:

```
var annotable = $("#imageExample").annotable({
    draggable: ".annotation",
    ... // other optional settings 
});    
```

If use class selector, the annotable variable is an array.

#### Optional configuration parameters 

All properties are **OPTIONAL** and they merge with the default.

```
/* COMPLETE and DEFAULT VALUES */ 

var options = {
    draggable: ".draggable-annotation", //draggable annotations

    hint: { //hint settings
        enabled: true, //if false, not show the hint
        message: "Drag and Drop to Annotate", //hint message
        icon: '<i class="far fa-question-circle"></i>', //hint icon        
        messageMove: "Drag to set new annotation position", //message on mouseover annotation
        iconMove: '<i class="fas fa-info"></i>',  //icon on mouseover annotation
        messageRotate: "Move to set new annotation rotation",  //message on start rotate annotation
        iconRotate: '<i class="fas fa-info"></i>',  //icon on start rotate annotation
    },

    popup: { //popup settings        
        buttonRotate: '<i class="fas fa-sync-alt"></i>', //icon or text of rotate button 
        tooltipRotate: "Change the rotation of annotation", //tooltip of rotate button 
        buttonRemove: '<i class="fas fa-trash"></i>', //icon or text of remove button 
        tooltipRemove: "Remove the annotation", //tooltip of remove button 
        tooltipText: "Text of annotation", //tooltip of annotation text
        tooltipTextarea: "Text of annotation", //tooltip of annotation textarea input
        placeholderTextarea: "Enter Text", //placeholder of annotation textarea input
    },

    annotationStyle: { //annotation style 
        borderColor: '#ffffff', // border color for annotation   
        borderSize: 2, // border width for annotation  [1-12] 
        hiBorderColor: '#fff000', // border color for highlighted annotation  
        hiBorderSize: 2.2,  //border width for highlighted annotation  [1-12]    
        imageBorder: true, //if false, not show the border on annotation with image
        foreground: true //if false, not brings the annotation to the foreground when the mouseover
    }
};
```

## Initialize annotation item (draggable)

- Annotation with image
    ```
    <img class="draggable-annotation" src="example.jpg" annotation-text="example" />
    ```
- Simple Annotation
    ```
    <div class="draggable-annotation" annotation-text="example" annotation-width="200" annotation-height="400"> Example </div>
    ```

#### Configuration attributes 

| Attribute | Default | Description |
| --- | :---: | --- |
| annotation-id | `undefined` | Id of annotation. |
| annotation-text | `undefined` | Text of annotation, is shown on mouseover. |
| annotation-width | `50` | Width of annotation expressed in pixels (px). If use Annotation with image, the default value is `naturalWidth` of image. |
| annotation-height | `50` | Height of annotation expressed in pixels (px). If use Annotation with image, the default value is `naturalHeight` of image. |
| annotation-rotation | `0` | Rotation of the annotation with respect to the x-axis, expressed in degrees. |
| annotation-editable | `"noText"` | `"disabled"`: the annotation is not editable. `"noText"`: the annotation can be rotated, moved and deleted `"full"`: the annotation can be edited. |

Pixels of annotation are relative to natural size of annotable element.

## API Methods

You can use API methods using:

- Annotable variable
    ```
    var annotable = $("#imageExample").annotable(); //Initialize
    annotable.method();    

        or 

    var annotables = $(".imagesExample").annotable(); //Initialize
    annotables[0].method();  // Use method at first element 
    ```
- jQuery selector 
    
    ```
    $("#imageExample").annotable(); //Initialize
    $("#imageExample").method();    

        or 

    $(".imagesExample").annotable(); //Initialize
    $(".imagesExample").method();  // Use method at all elements
    ```


### - addAnnotation(*myAnnotation*, *annotationReplaced*)

Adds a new custom annotation, or replaces an existing one. In the latter case, the parameter `annotationReplaced` is the annotation to replace.

Custom annotations are object, according to the following example:

```
var myAnnotation = {
    /** Id of annotation. [OPTIONAL] **/
    id: "1", 

    /** The URL of the image if you make Annotation with image. [OPTIONAL] **/
    image: "http://www.example.com/myimage.jpg",

    /** Text of annotation, is shown on mouseover. **/
    text: "My annotation", 

    /** "disabled", "noText", "full" [OPTIONAL - default is "noText"] **/
    editable: "noText", 

    /** Position of annotation inside the annotable element (pixels are relative to natural size of annotable element) **/
    position: {
        center: { x: 0, y: 0 } //coordinate of center of annotation (px)
    },

    /** Rotation of the annotation with respect to the x-axis (degrees). [OPTIONAL - default is 0] **/
    rotation: 0, 

    /** Width of annotation (px). If use Annotation with image. [OPTIONAL if make Annotation with image - default value is `naturalWidth` of image] **/
    width: 123, 

    /** Height of annotation (px). If use Annotation with image. [OPTIONAL if make Annotation with image - default value is `naturalHeight` of image] **/
    height: 123 
};
```


### - getAnnotations()

Returns an array of annotations.


### - removeAnnotation(*annotation*)

Removes an annotation.


### - removeAll(*id*)

If the optional `id` parameter is set, only annotations with the specified id will be removed. Otherwise all annotations will be removed.


### - hideAnnotations()

Hides existing annotations.


### - showAnnotations()

Shows existing annotations. (if they were hidden using annotable.hideAnnotations()).


### - highlightAnnotation(annotation)

Highlights the specified annotation, just as if the mouse pointer was hovering over it. The annotation will remain highlighted until one of these conditions is met:
* The user moves the mouse into, and out of the annotation
* The user moves the mouse over another annotation
* The highlight is removed by calling this method with an empty parameter (`highlightAnnotation()` or `highlightAnnotation(undefined)`)
* Another annotation is highlighted via `highlightAnnotation()`

The `annotation` parameter can be the annotation `id`, in this case all annotations with the specified id will be highlighted.


### - on(eventType, callback)

Adds an event handler function. You can register for the following events:

- `onMouseMoveOverItem` (event, coordinate): Fired when the mouse move inside the annotatable media area.
- `onAnnotationCreated` (event, annotation): Fired when an annotation was created.
- `onAnnotationUpdated` (event, annotation): Fired when an existing annotation was updated (edited, rotated or moved).
- `onAnnotationRemoved` (event, annotation): Fired when an annotation is removed from an item.

Example:

``` 
annotable.on('onAnnotationCreated', function (event, annotation) {
    console.log(annotation);
});

    or 

$("#imageExample").on('onAnnotationCreated', function (event, annotation) {
    console.log(annotation);
});    
```   

## Getting Involved

Want to help out? Found a bug? Missing a feature? Post an issue on our [issue tracker](https://github.com/AntoninoBonanno/DragDropAnnotate/issues).

I welcome contributions no matter how small or big!
