# DragDrop Annotate

<p align="center">
    <a href="https://github.com/AntoninoBonanno/DragDropAnnotate/releases"><img src="https://img.shields.io/github/v/release/AntoninoBonanno/DragDropAnnotate?label=Latest%20release" alt="Latest release"></a>
<a href="https://github.com/semantic-release/semantic-release"><img src="https://img.shields.io/badge/semantic--release-conventional-e10079?logo=semantic-release" alt="semantic-release: conventional" /></a>
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

[Official Page](https://antoninobonanno.github.io/DragDropAnnotate) - [Demo](https://antoninobonanno.github.io/DragDropAnnotate/example/index.html)

Are you looking for an image annotation toolkit (not drag and drop) written in JavaScript? Check out [this project](https://github.com/AntoninoBonanno/annotorious).

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/C0C46QJ0M)

## Dependencies

* [jQuery](https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js) >= 1.8.2
* [jQuery UI](https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js) >= 1.12.1
* [Fontawesome](https://fontawesome.com/) (Optional - you can change the icons)

## Usage

To set up **DragDropAnnotate** on a Web page, add this code to your page head:

```html
<!-- jQuery -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js" crossorigin="anonymous"></script>

<!-- Fontawesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" type="text/css" />

<!-- DragDropAnnotate -->
<link rel="stylesheet" href="./src/dragDropAnnotate.min.css" type="text/css" />
<script src="./src/dragDropAnnotate.min.js"></script>

```

## Initialize annotable item (droppable)

```html
<img id="imageExample" src="example.jpg">
```

In its simplest case, **DragDropAnnotate** can be initialised with a single line of Javascript:

```javascript
var annotable = $("#imageExample").annotable();   
```

Or use optional configuration parameters:

```javascript
var annotable = $("#imageExample").annotable({
    draggable: ".annotation",
    ... // other optional settings 
});    
```

If you use class selector, the annotable variable is an array.

#### Optional configuration parameters 

All properties are **OPTIONAL**, and they merge with the default.

```javascript
/* COMPLETE and DEFAULT VALUES */
const MetadataValue = {
  ID: 'id', //Print id of annotation if exists,
  TEXT: "text", //Print the annotation text
  TIMESTAMP: "timestamp", //Print the annotation creation date
  PROGRESSIVE: "progressive" //Print the progressive counter insertion of annotations
}

var options = {
    draggable: ".draggable-annotation", //draggable annotations

    hint: { //hint settings
        enabled: true, //if false, not show the hint
        message: "Drag and Drop to Annotate", //hint message
        icon: '<i class="fa-regular fa-circle-question"></i>', //hint icon        
        messageMove: "Drag to set new annotation position", //message on mouseover annotation
        iconMove: '<i class="fa-solid fa-info"></i>',  //icon on mouseover annotation
        messageRotate: "Move to set new annotation rotation",  //message on start rotate annotation
        iconRotate: '<i class="fa-solid fa-info"></i>',  //icon on start rotate annotation
    },

    popup: { //popup settings        
        buttonRotate: '<i class="fa-solid fa-rotate"></i>', //icon or text of rotate button 
        tooltipRotate: "Change the rotation of annotation", //tooltip of rotate button 
        buttonRemove: '<i class="fa-solid fa-trash"></i>', //icon or text of remove button 
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
    },
    
    metadata: { //metadata settings
        enabled: false, //if true, show the metadata
        value: MetadataValue.PROGRESSIVE, //the metadata to show [MetadataValue | (annotation) => string]
        fontSize: "40px", //the font size of text
        fontFamily: "sans-serif", //the font family of text
        color: "#ff0000", //the color of text
        position: "bottom-right", //the position of text ["y-x"] -> y: ["top"|"middle"|"bottom"], x: ["left"|"center"|"right"]
        offsetX: -20, //the offset from x
        offsetY: -10 //the offset from y
    }
};
```

#### Show metadata value

For each annotation you can show a text that can have the following values:
- `id`: Print id of annotation if exists
- `text`: Print the annotation text
- `timestamp`: Print the annotation creation date
- `progressive`: Print the progressive counter insertion of annotations
- **function**: You can pass a function that takes 'annotation' as a variable and returns the string you want to print (`(annotation) => string`)

**Examples**

```javascript
var annotable = $("#imageExample").annotable({
  draggable: ".annotation",
  metadata: {
    enabled: true,
    value: "id"
  }
});

// or 

var annotable = $("#imageExample").annotable({
    draggable: ".annotation",
    metadata: {
      enabled: true,
      value: (annotation) => {
        return `My custom string ${annotation.id}`;
      },
      position: "middle-center"
    }
});    
```

## Initialize annotation item (draggable)

- Annotation with image
    ```html
    <img class="draggable-annotation" src="example.jpg" annotation-text="example" />
    ```
- Simple Annotation
    ```html
    <div class="draggable-annotation" annotation-text="example" annotation-width="200" annotation-height="400"> Example </div>
    ```

#### Configuration attributes 

| Attribute           |   Default   | Description                                                                                                                                                                                      |
|---------------------|:-----------:|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| annotation-id       | `undefined` | Id of annotation.                                                                                                                                                                                |
| annotation-text     | `undefined` | Text of annotation, is shown on mouseover.                                                                                                                                                       |
| annotation-width    |    `50`     | Width of annotation expressed in pixels (px).<br />If use Annotation with image, the default value is `naturalWidth` of image.                                                                   |
| annotation-height   |    `50`     | Height of annotation expressed in pixels (px).<br />If use Annotation with image, the default value is `naturalHeight` of image.                                                                 |
| annotation-rotation |     `0`     | Rotation of the annotation with respect to the x-axis, expressed in degrees.                                                                                                                     |
| annotation-editable | `"noText"`  | `"disabled"`: the annotation is not editable.<br />`"noText"`: the annotation can be rotated, moved and deleted.<br />`"full"`: the annotation can be edited (text), rotated, moved and deleted. |

Pixels of annotation are relative to natural size of annotable element.

## API Methods

You can use API methods using:

- Annotable variable
    ```javascript
    var annotable = $("#imageExample").annotable(); //Initialize
    annotable.method();    

    // or 

    var annotables = $(".imagesExample").annotable(); //Initialize
    annotables[0].method();  // Use method at first element 
    ```
- jQuery selector 
    
    ```javascript
    $("#imageExample").annotable(); //Initialize
    $("#imageExample").method();    

    // or 

    $(".imagesExample").annotable(); //Initialize
    $(".imagesExample").method();  // Use method at all elements
    ```


### - addAnnotation(*myAnnotation*, *annotationReplaced*)

Adds a new custom annotation, or replaces an existing one. In the latter case, the parameter `annotationReplaced` is the annotation to replace.

Custom annotations are object, according to the following example:

```javascript
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

```javascript
annotable.on('onAnnotationCreated', function (event, annotation) {
    console.log(annotation);
});

// or 

$("#imageExample").on('onAnnotationCreated', function (event, annotation) {
    console.log(annotation);
});    
```   

## Getting Involved

Want to help out? Found a bug? Missing a feature? Post an issue on our [issue tracker](https://github.com/AntoninoBonanno/DragDropAnnotate/issues).

I welcome contributions no matter how small or big!

## Development

1. Clone project
2. Run `npm install` command, to install dev dependencies
3. Run `npm run start`, to run dev server
4. Edit `src/dragDropAnnotate.css` or `src/dragDropAnnotate.js`
