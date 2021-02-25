"use strict";

(function ($) {

    /** Internal classes (Protected) **/

    var Events = {
        MOUSE_MOVE_ANNOTATABLE_ITEM: 'onMouseMoveOverItem', //The mouse move inside the annotatable media area
        ANNOTATION_REMOVED: 'onAnnotationRemoved', //An annotation was removed
        ANNOTATION_CREATED: 'onAnnotationCreated', //An annotation was created
        ANNOTATION_UPDATED: 'onAnnotationUpdated' //An existing annotation was updated
    };

    /**
     * Disable touch events on drag started 
     */
    var dragStarted = false;

    /**
     * Return the object of Coordinate for print
     * @param {*} coordinate 
     */
    function printCoordinate(coordinate) {
        return { "x": coordinate.x, "y": coordinate.y };
    }

    /**
     * Touch Handler
     * @param {*} event ["touchstart", "touchmove", "touchend", "touchcancel"]
     */
    function touchHandler(event) {
        var touch = event.changedTouches[0];

        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent({
            touchstart: "mousedown",
            touchmove: "mousemove",
            touchend: "mouseup"
        }[event.type], true, true, window, 1,
            touch.screenX, touch.screenY,
            touch.clientX, touch.clientY, false,
            false, false, false, 0, null);

        touch.target.dispatchEvent(simulatedEvent);

        if (dragStarted) {
            event.preventDefault();
        }
    }

    // Add Touch Handler
    document.addEventListener("touchstart", touchHandler, { passive: false });
    document.addEventListener("touchmove", touchHandler, { passive: false });
    document.addEventListener("touchend", touchHandler, { passive: false });
    document.addEventListener("touchcancel", touchHandler, { passive: false });

    /**
     * Geometry of rectangle annotation
     * @param {Object {x,y}} center Annotation coordinate relative to the center of the image
     * @param {Number} width Width of annotation
     * @param {Number} height Height of annotation
     * @param {Number} rotation Rotation of annotation than the x-axis
     */
    var Geometry = function (center, width = 50, height = 50, rotation = 0) {
        this.center = center;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
        this.area = width * height;

        var _vertices = undefined;

        var self = this;
        /** Create the vertices of annotation for calculating the intersection with a point (also with rotation) */
        var _createVertices = function () {
            var angle = self.rotation * Math.PI / 180;
            var sin = Math.sin(angle), cos = Math.cos(angle);

            var width = self.width / 2;
            var height = self.height / 2;

            var wc = (width * cos), hs = (height * sin), ws = (width * sin), hc = (height * cos);

            _vertices = {};
            _vertices.topR = { x: (self.center.x + wc - hs), y: (self.center.y - ws - hc) };
            _vertices.topL = { x: (self.center.x - wc - hs), y: (self.center.y + ws - hc) };
            _vertices.botL = { x: (self.center.x - wc + hs), y: (self.center.y + ws + hc) };
            _vertices.botR = { x: (self.center.x + wc + hs), y: (self.center.y - ws + hc) };
        };

        /** Checks whether a geometry intersects a point **/
        this.intersect = function (px, py) {
            if (!_vertices) _createVertices();

            var area = Math.abs((px * _vertices.topL.y - _vertices.topL.x * py) + (_vertices.botR.x * py - px * _vertices.botR.y) + (_vertices.topL.x * _vertices.botR.y - _vertices.botR.x * _vertices.topL.y)) / 2;
            area += Math.abs((px * _vertices.botR.y - _vertices.botR.x * py) + (_vertices.botL.x * py - px * _vertices.botL.y) + (_vertices.botR.x * _vertices.botL.y - _vertices.botL.x * _vertices.botR.y)) / 2;
            area += Math.abs((px * _vertices.botL.y - _vertices.botL.x * py) + (_vertices.topR.x * py - px * _vertices.topR.y) + (_vertices.botL.x * _vertices.topR.y - _vertices.topR.x * _vertices.botL.y)) / 2;
            area += Math.abs((px * _vertices.topR.y - _vertices.topR.x * py) + (_vertices.topL.x * py - px * _vertices.topL.y) + (_vertices.topR.x * _vertices.topL.y - _vertices.topL.x * _vertices.topR.y)) / 2;

            return area <= self.area;
        };

        /** Returns the coordinates of the lowest vertex **/
        this.getLowerVertex = function () {
            if (!_vertices) _createVertices();
            if (!_vertices.lowerVertex) {
                _vertices.lowerVertex = { x: _vertices.botL.x, y: _vertices.botL.y };
                Object.keys(_vertices).forEach(key => {
                    if (_vertices.lowerVertex.y < _vertices[key].y) _vertices.lowerVertex = { x: _vertices[key].x, y: _vertices[key].y }
                });
            }
            return _vertices.lowerVertex;
        }

        /** Update correctly the center or rotation **/
        this.update = function (center, rotation) {
            if (center) self.center = center;
            if (rotation) {
                while (rotation > 360) rotation -= 360;
                self.rotation = rotation;
            }
            _vertices = undefined;
        };

        /** Return the object of Geometry for print **/
        this.print = function () {
            if (!_vertices) _createVertices();
            return {
                "position": {
                    "center": printCoordinate(self.center),
                    "topL": printCoordinate(_vertices.topL),
                    "topR": printCoordinate(_vertices.topR),
                    "botL": printCoordinate(_vertices.botL),
                    "botR": printCoordinate(_vertices.botR)
                },
                "rotation": self.rotation,
                "width": width,
                "height": height
            };
        }
    };

    /**
     * Annotation from a image
     * @param {Number} id Id of annotation
     * @param {Image} image JS Image
     * @param {String} text Text of annotation
     * @param {Geometry} geometry Geometry of annotation
     * @param {Boolean} editable if true enable to edit annotation
     */
    var Annotation = function (id, image, text, geometry, editable = true) {
        this.id = id;
        this.text = text;
        if (image instanceof Image) this.image = image;
        this.geometry = geometry;
        this.editable = editable;
        this.created_at = Date.now();

        var self = this;
        /** Return the object of Annotation for print **/
        this.print = function () {
            return {
                "id": self.id,
                "image": (self.image) ? self.image.src : undefined,
                "text": self.text,
                ...self.geometry.print(),
                "editable": self.editable,
                "created_at": self.created_at
            };
        };

        /** Check if print is equal to Annotation **/
        this.isEqualPrint = function (annotation) {
            if (!annotation instanceof Object) return false;
            if (annotation["created_at"] == self.created_at) return true;
            return false;
        }
    };

    /**
     * Hint messages
     * @param {jQuery} container 
     * @param {Object} opts options
     */
    var Hint = function (container, opts) {
        if (!opts["hint"]["enabled"]) return;

        /** Constructor **/
        var _message = $('<div class="dda-hint-msg dda-opacity-fade" style="opacity: 0;">' + opts["hint"]["message"] + '</div>');
        var _icon = $('<div class="dda-hint-icon">' + opts["hint"]["icon"] + '</div>');
        var _hint = $('<div class="dda-hint"></div>');
        _hint.append(_message);
        _hint.append(_icon);
        container.append(_hint);

        var _hideTimer = undefined;

        var self = this;
        _icon.mouseover(function () {
            self.show();
        });

        _icon.mouseout(function () {
            self.hide();
        });

        $(opts["draggable"]).mouseover(function () {
            self.show();
        });

        /** Public method**/

        /** Show the hint **/
        this.show = function (icon, message) {
            clearTimeout(_hideTimer);
            if (icon) _icon.html(icon);
            if (message) _message.html(message);
            _message.css("opacity", 1);
            _hideTimer = setTimeout(function () {
                self.hide();
            }, 3000);
        };

        /** Hide the hint **/
        this.hide = function () {
            clearTimeout(_hideTimer);
            _message.css("opacity", 0);
            _message.html(opts["hint"]["message"]);
            _icon.html(opts["hint"]["icon"]);
        };
    };

    /**
     * The popup shown on mouse over annotation
     * @param {Annotator} annotator 
     * @param {jQuery} container 
     * @param {Object} opts options
     */
    var Popup = function (annotator, container, opts) {

        /** Constructor **/
        var _buttonGroup = $('<div class="dda-popup-buttons"></div>');
        var _buttonRotate = $('<button role="button" class="dda-popup-button-rotate" data-toggle="tooltip" title="' + opts["popup"]["tooltipRotate"] + '">' + opts["popup"]["buttonRotate"] + '</button>');
        var _buttonRemove = $('<button role="button" class="dda-popup-button-remove" data-toggle="tooltip" title="' + opts["popup"]["tooltipRemove"] + '">' + opts["popup"]["buttonRemove"] + '</button>');
        _buttonGroup.append(_buttonRotate);
        _buttonGroup.append(_buttonRemove);

        var _popup = $('<div class="dda-popup"></div>').hide();
        _popup.append($('<div class="dda-popup-text" data-toggle="tooltip" title="' + opts["popup"]["tooltipText"] + '"></div>'));
        _popup.append(_buttonGroup);
        container.append(_popup);

        var _mouseIsAbove = false;
        var _cachedAnnotation = undefined;

        var self = this;
        _popup.mouseover(function (event) { _mouseIsAbove = true; });
        _popup.mouseout(function (event) { _mouseIsAbove = false; });

        _buttonRotate.click(function (event) {
            if (_cachedAnnotation.editable) annotator.startRotateAnnotation(_cachedAnnotation);
        });
        _buttonRemove.click(function (event) {
            if (_cachedAnnotation.editable) annotator.removeAnnotation(_cachedAnnotation);
        });

        /** Public method **/

        /** Show the Popup on specific position **/
        this.show = function (annotation, position) {
            _cachedAnnotation = annotation;
            if (_cachedAnnotation.text) _popup.children(".dda-popup-text").show().html(_cachedAnnotation.text);
            else _popup.children(".dda-popup-text").hide();
            if (_cachedAnnotation.editable) _buttonGroup.show();
            else _buttonGroup.hide();

            _popup.css({ top: position.y, left: position.x }).show();
        };

        /** Hide the Popup if there is no interaction or force to hide **/
        this.hide = function (force = false) {
            if (self.isHidden() || (_mouseIsAbove && !force)) return;
            var timer = setTimeout(function () {
                if (!_mouseIsAbove || force) {
                    _cachedAnnotation = undefined;
                    _popup.hide();
                }
                clearTimeout(timer);
            }, 300);
        };

        /** Check if Popup is hidden **/
        this.isHidden = function () {
            return _popup.is(":hidden");
        };
    };

    /**
     * Annotator 
     * @param {jQuery} container 
     * @param {Object} opts options
     * @param {function} fireEventFn Function used to fire events
     */
    var Annotator = function (container, opts, fireEventFn) {

        /** Constructor **/
        var _canvas = $('<canvas class="dda-canvas"></canvas>');
        container.append(_canvas);

        var _popup = new Popup(this, container, opts);
        var _hint = new Hint(container, opts);

        var _annotations = [];
        var _editAnnotationFn = undefined;
        var _draggedAnnotation = undefined;
        var _currentAnnotation = undefined;
        var _ctx = _canvas[0].getContext("2d");

        var self = this;
        _canvas.droppable({
            drop: function (event, ui) {
                _draggedAnnotation.geometry.update(_getUiCoordinate(ui.offset.left, ui.offset.top));
                self.addAnnotation(_draggedAnnotation);
                _draggedAnnotation = undefined;
            },
            over: function (event, ui) {
                if (!ui.helper.is(":hidden")) ui.helper.hide();
                _draggedAnnotation = new Annotation(
                    ui.draggable.attr("annotation-id"),
                    ui.draggable[0], ui.draggable.attr("annotation-text"),
                    new Geometry(
                        _getUiCoordinate(ui.offset.left, ui.offset.top),
                        ui.draggable.attr("annotation-width") || ui.draggable[0].naturalWidth,
                        ui.draggable.attr("annotation-height") || ui.draggable[0].naturalHeight,
                        ui.draggable.attr("annotation-rotation"),
                        ui.draggable.attr("annotation-editable")
                    )
                );
            },
            out: function (event, ui) {
                if (ui.helper.is(":hidden")) ui.helper.show();
                _draggedAnnotation = undefined;
                self.redrawAnnotations();
            }
        });

        _canvas.mousemove(function (event) {
            var coordinate = _toOriginalCoord(event.offsetX, event.offsetY);
            fireEventFn(Events.MOUSE_MOVE_ANNOTATABLE_ITEM, printCoordinate(coordinate));

            if (_draggedAnnotation) {
                self.redrawAnnotations();
                _draggedAnnotation.geometry.update(coordinate);
                _drawAnnotation(_draggedAnnotation);
                return;
            }

            if (_editAnnotationFn) { _editAnnotationFn(coordinate); return; }

            var topAnnotation = _getAnnotationAt(coordinate);
            if (topAnnotation.length == 0) {
                _currentAnnotation = topAnnotation = undefined;
                _canvas.css('cursor', 'default');
                _popup.hide();
                self.redrawAnnotations();
                return;
            }

            if (_popup.isHidden() || _currentAnnotation != topAnnotation[0]) {
                if (_currentAnnotation != topAnnotation[0]) {
                    _currentAnnotation = topAnnotation[0];
                    if (_hint.show) _hint.show(opts["hint"]["iconMove"], opts["hint"]["messageMove"]);
                    _canvas.css('cursor', 'move');
                    self.redrawAnnotations(_currentAnnotation);
                }
                _popup.show(_currentAnnotation, _getPopupPosition());
            }
        });

        _canvas.mouseup(function (event) {
            if (_editAnnotationFn) {
                var edited = _editAnnotationFn();
                fireEventFn(Events.ANNOTATION_UPDATED, [edited.new.print(), edited.old_print]);
                _editAnnotationFn = undefined;
            }
        });

        _canvas.mousedown(function (event) {
            if (!_currentAnnotation || _editAnnotationFn) return;
            _popup.hide(true);
            var old_annotation = _currentAnnotation.print();

            var offsetOfCenter = _toOriginalCoord(event.offsetX, event.offsetY);
            offsetOfCenter = { x: offsetOfCenter.x - _currentAnnotation.geometry.center.x, y: offsetOfCenter.y - _currentAnnotation.geometry.center.y };

            _editAnnotationFn = function (coordinate) {
                if (coordinate) {
                    _currentAnnotation.geometry.update({
                        x: coordinate.x - offsetOfCenter.x,
                        y: coordinate.y - offsetOfCenter.y
                    });
                    self.redrawAnnotations(_currentAnnotation);
                }
                return { new: _currentAnnotation, old_print: old_annotation };
            };
        });

        /** Private method **/

        /** Transform the resized coordinate to original coordinate **/
        var _toOriginalCoord = function (x, y) {
            return { x: parseInt((x / _canvas.width()) * _canvas[0].width), y: parseInt((y / _canvas.height()) * _canvas[0].height) };
        };

        /** Transform the original coordinate to resized coordinate **/
        var _fromOriginalCoord = function (x, y) {
            return { x: parseInt((x * _canvas.width()) / _canvas[0].width), y: parseInt((y * _canvas.height()) / _canvas[0].height) };
        };

        /** Get the UI coordinate on drang & drop **/
        var _getUiCoordinate = function (oLeft, oTop) {
            return _toOriginalCoord((oLeft - _canvas.offset().left), (oTop - _canvas.offset().top));
        };

        /** Get the popup position from the current annotation **/
        var _getPopupPosition = function () {
            if (!_currentAnnotation) return;
            var loverVertex = _currentAnnotation.geometry.getLowerVertex();
            return _fromOriginalCoord(loverVertex.x, loverVertex.y);
        }

        /** Draw an annotation **/
        var _drawAnnotation = function (annotation, highlight = false) {
            var x = -annotation.geometry.width / 2, y = -annotation.geometry.height / 2;

            _ctx.save();
            _ctx.beginPath();

            _ctx.translate(annotation.geometry.center.x, annotation.geometry.center.y);
            _ctx.rotate(- annotation.geometry.rotation * Math.PI / 180);

            if (annotation.image) _ctx.drawImage(annotation.image, x, y, annotation.geometry.width, annotation.geometry.height);

            if (!annotation.image || opts["annotationStyle"]["imageBorder"]) {
                var borderSize, borderColor;
                if (highlight) {
                    borderColor = opts["annotationStyle"]["hiBorderColor"];
                    borderSize = opts["annotationStyle"]["hiBorderSize"];
                } else {
                    borderColor = opts["annotationStyle"]["borderColor"];
                    borderSize = opts["annotationStyle"]["borderSize"];
                }

                _ctx.lineJoin = "round";
                _ctx.lineWidth = 1;
                _ctx.strokeStyle = '#000000';
                _ctx.strokeRect(
                    x + 1 / 2,
                    y + 1 / 2,
                    annotation.geometry.width - 1,
                    annotation.geometry.height - 1
                );

                _ctx.lineJoin = "miter";
                _ctx.lineWidth = borderSize;
                _ctx.strokeStyle = borderColor;
                _ctx.strokeRect(
                    x + 1 + borderSize / 2,
                    y + 1 + borderSize / 2,
                    annotation.geometry.width - 2 - borderSize,
                    annotation.geometry.height - 2 - borderSize
                );
            }
            _ctx.restore();
        };

        /** Returns the annotations that have the coordinate inside **/
        var _getAnnotationAt = function (coordinate) {
            var intersectedAnnotations = [];
            _annotations.forEach(annotation => {
                if (annotation.geometry.intersect(coordinate.x, coordinate.y)) intersectedAnnotations.push(annotation);
            });
            intersectedAnnotations = intersectedAnnotations.reverse();

            return intersectedAnnotations;
        };

        /** Public method**/

        /** Resize the Viewer **/
        this.resize = function (width, height) {
            _canvas[0].width = width;
            _canvas[0].height = height;
        };

        /** Clear all drawings **/
        this.clear = function () {
            _ctx.clearRect(0, 0, _canvas[0].width, _canvas[0].height);
        };

        /** Redraw the annotations **/
        this.redrawAnnotations = function (annotationToHighlight = undefined) {
            self.clear();
            var foregroundAnno = undefined;
            _annotations.forEach(annotation => {
                var isEqual = (!annotationToHighlight) ? false : ((annotationToHighlight instanceof Object) ? (annotation == annotationToHighlight) : annotation.id === annotationToHighlight);
                if (isEqual && opts["annotationStyle"]["foreground"]) {
                    if (foregroundAnno) _drawAnnotation(foregroundAnno, true);
                    foregroundAnno = annotation;
                    return;
                }
                _drawAnnotation(annotation, isEqual);
            });
            if (foregroundAnno) _drawAnnotation(foregroundAnno, true);
        };

        /** Returns all annotations **/
        this.getAnnotations = function () {
            return _annotations;
        }

        /** Add a new annotation  **/
        this.addAnnotation = function (annotation, annotationReplaced = undefined, fireEvent = true) {
            if (annotationReplaced) {
                var index = _annotations.indexOf(annotationReplaced);
                if (index > -1) {
                    _annotations[index] = annotation;
                    self.redrawAnnotations();
                }
                return;
            }

            //push annotations sorted by decreasing area
            var isLast = true;
            for (let index = 0; index < _annotations.length; index++) {
                const element = _annotations[index];
                if (element.geometry.area < annotation.geometry.area) {
                    _annotations.splice(index, 0, annotation);
                    isLast = false;
                    break;
                }
            }
            if (isLast) _annotations.push(annotation);

            _drawAnnotation(annotation);
            if (fireEvent) fireEventFn(Events.ANNOTATION_CREATED, [annotation.print()]);
        };

        /** Rotate the annotation **/
        this.startRotateAnnotation = function (annotation) {
            _popup.hide(true);
            if (_hint.show) _hint.show(opts["hint"]["iconRotate"], opts["hint"]["messageRotate"]);
            _canvas.css('cursor', 'default');
            var old_annotation = annotation.print();

            var startRotation;
            _editAnnotationFn = function (coordinate) {
                if (coordinate) {
                    var rotation = Math.atan2(coordinate.y - annotation.geometry.center.y, coordinate.x - annotation.geometry.center.x) * 180 / Math.PI;
                    annotation.geometry.update(
                        undefined,
                        annotation.geometry.rotation + (startRotation - rotation)
                    );
                    startRotation = rotation;
                    self.redrawAnnotations(annotation);
                }
                return { new: annotation, old_print: old_annotation };
            };
        };

        /** Remove the annotation **/
        this.removeAnnotation = function (annotation, fireEvent = true) {
            _popup.hide(true);
            _annotations.splice(_annotations.indexOf(annotation), 1);
            if (fireEvent) fireEventFn(Events.ANNOTATION_REMOVED, [annotation.print()]);
            self.redrawAnnotations();
        };

        /** Remove all annotations **/
        this.removeAll = function (id = undefined) {
            if (id) {
                _annotations = _annotations.filter(annotation => annotation.id !== id);
                self.redrawAnnotations();
                return;
            }
            _annotations = [];
            self.clear();
        }
    };

    /** External API **/

    /**
     * Annotable
     * @param {Image} image 
     * @param {Object} opts options 
     */
    var Annotable = function (image, opts) {

        /** Constructor **/
        this.image = (image instanceof $) ? image : $(image);
        if (!this.image[0] instanceof Image) $.error('Annotable it must be an image.');
        this.image.wrap($('<div class="dda-annotationlayer"></div>'));

        var self = this;
        var _annotator = new Annotator(this.image.parent(), opts, function (event, arg) {
            self.image.trigger(event, arg);
        });

        if (this.image[0].complete) _annotator.resize(this.image[0].naturalWidth, this.image[0].naturalHeight);
        else this.image[0].onload = function () { _annotator.resize(this.naturalWidth, this.naturalHeight); };

        /** Private method **/

        /** Add the Annotation from Annotation Printed **/
        var _addAnnotation = function (annotationPrinted, image, annotationReplaced) {
            var replace = (annotationReplaced) ? _findAnnotation(annotationReplaced) : undefined;
            _annotator.addAnnotation(new Annotation(
                annotationPrinted["id"],
                image, annotationPrinted["text"],
                new Geometry(
                    annotationPrinted["position"]["center"],
                    annotationPrinted["width"] || image.naturalWidth,
                    annotationPrinted["height"] || image.naturalHeight,
                    annotationPrinted["rotation"]
                ),
                annotationPrinted["editable"]
            ), replace, false);
        };

        /** Find the Annotation from Annotation Printed**/
        var _findAnnotation = function (annotationPrinted) {
            var annotation = _annotator.getAnnotations().find(function (annotation) {
                return annotation.isEqualPrint(annotationPrinted);
            });
            if (!annotation) $.error("Annotation not found.");
            return annotation;
        };

        /** Public method **/

        /** Adds a new annotation, or replaces an existing one. In the latter case, the parameter annotationReplaced is the annotation to replace **/
        this.addAnnotation = function (annotationPrinted, annotationReplaced = undefined) {
            if (!annotationPrinted["position"] ||
                !annotationPrinted["position"]["center"] ||
                !annotationPrinted["position"]["center"]["x"] ||
                !annotationPrinted["position"]["center"]["y"]
            ) $.error('Invalid annotation.');

            if (annotationPrinted["image"]) {
                if (annotationPrinted["image"] instanceof Image) _addAnnotation(annotationPrinted, annotationPrinted["image"], annotationReplaced);
                else {
                    if (!annotationPrinted["image"] instanceof String || !annotationPrinted["image"].includes("http")) $.error('Image must be a URL or an instance of Image.');
                    var image = new Image;
                    image.src = annotationPrinted["image"];
                    image.onload = function () { _addAnnotation(annotationPrinted, this, annotationReplaced); };
                }
            } else _addAnnotation(annotationPrinted, {}, annotationReplaced);
        };

        /** Returns an array of annotations **/
        this.getAnnotations = function () {
            var annotationsPrinted = [];
            _annotator.getAnnotations().forEach(annotation => {
                annotationsPrinted.push(annotation.print());
            });
            return annotationsPrinted;
        };

        /** Removes an annotation **/
        this.removeAnnotation = function (annotationPrinted) {
            _annotator.removeAnnotation(_findAnnotation(annotationPrinted), false);
        };

        /** Removes all annotations  **/
        this.removeAll = function (id = undefined) {
            _annotator.removeAll(id);
        };

        /** Hides existing annotations **/
        this.hideAnnotations = function () {
            _annotator.clear();
        };

        /** Shows existing annotations if they were hidden using hideAnnotations **/
        this.showAnnotations = function () {
            _annotator.redrawAnnotations();
        };

        /** Highlights the specified annotation, just as if the mouse pointer was hovering over it **/
        this.highlightAnnotation = function (annotationPrinted) {
            _annotator.redrawAnnotations(annotationPrinted instanceof Object ? _findAnnotation(annotationPrinted) : annotationPrinted);
        };

        /** Attach an event handler function for annotable item **/
        this.on = function (event, callback) {
            this.image.on(event, callback);
        }
    };

    /** 
     * Inizializer the annotable items
     */
    $.fn.annotable = function (methodOrOptions) {
        if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            var opts = $.extend(true, {}, $.fn.annotable.defaults, methodOrOptions);
            var instances = (this.length > 1) ? [] : undefined;

            if (!$(opts["draggable"]).is(":ui-draggable")) {
                $(opts["draggable"]).draggable({
                    helper: 'clone',
                    ghosting: true,
                    cursorAt: { top: 0, left: 0 },
                    revert: 'invalid',
                    start: function () {
                        dragStarted = true;
                    },
                    stop: function () {
                        dragStarted = false;
                    }
                });
            }
        }

        var args = Array.prototype.slice.call(arguments, 1);
        this.each(function () {
            var item = $(this), instance = item.data('annotable');
            if (!instance) {
                if (opts) {
                    instance = new Annotable(this, opts);
                    item.data('annotable', instance);

                    if (!instances) instances = instance;
                    else instances.push(instance);

                } else $.error('Annotable is not initialized.');
            }
            else if (typeof methodOrOptions === 'string' && instance[methodOrOptions]) {
                return instance[methodOrOptions].apply(instance, args);
            } else $.error('Method ' + methodOrOptions + ' does not exist on Annotable');
        });
        return instances;
    };

    /**
     * Default Options
     */
    $.fn.annotable.defaults = {
        "draggable": ".draggable-annotation", //draggable annotations
        "hint": { //hint settings
            "enabled": true, //if false, not show the hint
            "message": "Drag and Drop to Annotate", //hint message
            "icon": '<i class="far fa-question-circle"></i>', //hint icon
            "messageMove": "Drag to set new annotation position", //message on mouseover annotation
            "iconMove": '<i class="fas fa-info"></i>',  //icon on mouseover annotation
            "messageRotate": "Move to set new annotation rotation",  //message on start rotate annotation
            "iconRotate": '<i class="fas fa-info"></i>',  //icon on start rotate annotation
        },
        "popup": { //popup settings
            "buttonRotate": '<i class="fas fa-sync-alt"></i>', //icon or text of rotate button 
            "tooltipRotate": "Change the rotation of annotation", //tooltip of rotate button 
            "buttonRemove": '<i class="fas fa-trash"></i>', //icon or text of remove button 
            "tooltipRemove": "Remove the annotation", //tooltip of remove button 
            "tooltipText": "Text of annotation", //tooltip of annotation text 
        },
        "annotationStyle": { //annotation style 
            "borderColor": '#ffffff', // border color for annotation   
            "borderSize": 2, // border width for annotation  [1-12] 
            "hiBorderColor": '#fff000', // border color for highlighted annotation  
            "hiBorderSize": 2.2,  //border width for highlighted annotation  [1-12]    
            "imageBorder": true, //if false, not show the border on image annotation 
            "foreground": true //if false, not brings the annotation to the foreground when the mouseover
        }
    };

})(jQuery);
