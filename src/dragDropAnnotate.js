import "./dragDropAnnotate.css";

"use strict";

/**
 * DragDropAnnotate
 * https://github.com/AntoninoBonanno/DragDropAnnotate
 * @author Bonanno Antonino
 * @version v1.1.0
 * @licence LGPL-3.0-or-later
 *
 * jQuery plugin to annotate images easily with drag and drop.
 * DragDropAnnotate is a lightweight image annotation tool that make it easy to add custom markers, comments, hotspots to images via drag and drop.
 * Supports rectangle, and image annotations. The drag and drop functionality based on jQuery UI draggable widget.
 */
(function ($) {

    /** Internal classes (Protected) **/
    const Events = {
        MOUSE_MOVE_ANNOTATABLE_ITEM: 'onMouseMoveOverItem', //The mouse move inside the annotatable media area
        ANNOTATION_REMOVED: 'onAnnotationRemoved', //An annotation was removed
        ANNOTATION_CREATED: 'onAnnotationCreated', //An annotation was created
        ANNOTATION_UPDATED: 'onAnnotationUpdated' //An existing annotation was updated
    };

    const AnnotationEdits = {
        DISABLED: 'disabled', //The annotation is not editable
        NO_TEXT: 'noText', //The annotation can be rotated, moved and deleted
        FULL: 'full' //The annotation can be edited
    };

    /**
     * Check if touch drag started
     */
    let touchStarted = false;

    /**
     * Check if the device use touch
     */
    let isTouch = false;

    /**
     * Return the object of Coordinate for print
     * @param {{x: number, y: number}} coordinate
     */
    function printCoordinate(coordinate) {
        return {"x": coordinate.x, "y": coordinate.y};
    }

    /**
     * Touch Handler
     * @param {TouchEvent} event the event ["touchstart", "touchmove", "touchend", "touchcancel"]
     */
    function touchHandler(event) {
        const touch = event.changedTouches[0];
        isTouch = true;

        const simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent({
                touchstart: "mousedown",
                touchmove: "mousemove",
                touchend: "mouseup"
            }[event.type], true, true, window, 1,
            touch.screenX, touch.screenY,
            touch.clientX, touch.clientY, false,
            false, false, false, 0, null);

        touch.target.dispatchEvent(simulatedEvent);

        if (touchStarted) {
            event.preventDefault();
            const elem = document.elementFromPoint(touch.clientX, touch.clientY);
            if (elem instanceof HTMLCanvasElement) {
                elem.dispatchEvent(simulatedEvent);
            }
        }
    }

    // Add Touch Handler
    document.addEventListener("touchstart", touchHandler, {passive: false});
    document.addEventListener("touchmove", touchHandler, {passive: false});
    document.addEventListener("touchend", touchHandler, {passive: false});
    document.addEventListener("touchcancel", touchHandler, {passive: false});

    /**
     * Geometry of rectangle annotation
     * @param {{x: number,y: number}} center Annotation coordinate relative to the center of the image
     * @param {number} width Width of annotation
     * @param {number} height Height of annotation
     * @param {number} rotation Rotation of annotation than the x-axis
     */
    const Geometry = function (center, width = 50, height = 50, rotation = 0) {
        this.center = center;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
        this.area = width * height;

        let _vertices = undefined;

        const self = this;
        /** Create the vertices of annotation for calculating the intersection with a point (also with rotation) */
        const _createVertices = function () {
            const angle = self.rotation * Math.PI / 180;
            const sin = Math.sin(angle), cos = Math.cos(angle);

            const width = self.width / 2;
            const height = self.height / 2;

            const wc = (width * cos), hs = (height * sin), ws = (width * sin), hc = (height * cos);

            _vertices = {};
            _vertices.topR = {x: (self.center.x + wc - hs), y: (self.center.y - ws - hc)};
            _vertices.topL = {x: (self.center.x - wc - hs), y: (self.center.y + ws - hc)};
            _vertices.botL = {x: (self.center.x - wc + hs), y: (self.center.y + ws + hc)};
            _vertices.botR = {x: (self.center.x + wc + hs), y: (self.center.y - ws + hc)};
        };

        /**
         * Checks whether a geometry intersects a point
         * @param {number} px
         * @param {number} py
         * @returns {boolean}
         */
        this.intersect = function (px, py) {
            if (!_vertices) _createVertices();

            let area = Math.abs((px * _vertices.topL.y - _vertices.topL.x * py) + (_vertices.botR.x * py - px * _vertices.botR.y) + (_vertices.topL.x * _vertices.botR.y - _vertices.botR.x * _vertices.topL.y)) / 2;
            area += Math.abs((px * _vertices.botR.y - _vertices.botR.x * py) + (_vertices.botL.x * py - px * _vertices.botL.y) + (_vertices.botR.x * _vertices.botL.y - _vertices.botL.x * _vertices.botR.y)) / 2;
            area += Math.abs((px * _vertices.botL.y - _vertices.botL.x * py) + (_vertices.topR.x * py - px * _vertices.topR.y) + (_vertices.botL.x * _vertices.topR.y - _vertices.topR.x * _vertices.botL.y)) / 2;
            area += Math.abs((px * _vertices.topR.y - _vertices.topR.x * py) + (_vertices.topL.x * py - px * _vertices.topL.y) + (_vertices.topR.x * _vertices.topL.y - _vertices.topL.x * _vertices.topR.y)) / 2;

            return area <= self.area;
        };

        /** Returns the coordinates of the lowest vertex **/
        this.getLowerVertex = function () {
            if (!_vertices) {
                _createVertices();
            }
            if (!_vertices.lowerVertex) {
                _vertices.lowerVertex = {x: _vertices.botL.x, y: _vertices.botL.y};
                Object.keys(_vertices).forEach(key => {
                    if (_vertices.lowerVertex.y < _vertices[key].y) _vertices.lowerVertex = {
                        x: _vertices[key].x,
                        y: _vertices[key].y
                    }
                });
            }
            return _vertices.lowerVertex;
        }

        /**
         * Update correctly the center or rotation
         * @param {{x: number, y: number}|undefined} center
         * @param {number|undefined} rotation
         */
        this.update = function (center, rotation = undefined) {
            if (center) {
                self.center = center;
            }
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
     * Annotation from an image
     * @param {number} id Id of annotation
     * @param {HTMLImageElement|Image} image JS Image
     * @param {string} text Text of annotation
     * @param {Geometry} geometry Geometry of annotation
     * @param {string} editable Behavior of the annotation for editing
     */
    const Annotation = function (id, image, text, geometry, editable = AnnotationEdits.NO_TEXT) {
        this.id = id;
        this.text = text;
        if (image instanceof Image) {
            this.image = image;
        }
        this.geometry = geometry;
        this.editable = editable;
        this.created_at = Date.now();

        const self = this;
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

        /**
         * Check if print is equal to Annotation
         * @param {Annotation|object} annotation
         * @returns {boolean}
         */
        this.isEqualPrint = function (annotation) {
            if (!annotation instanceof Object) {
                return false;
            }
            return annotation["created_at"] === self.created_at;
        }
    };

    /**
     * Hint messages
     * @param {jQuery} container
     * @param {Object} opts options
     */
    const Hint = function (container, opts) {
        if (!opts["hint"]["enabled"]) return;

        /** Constructor **/
        const _message = $('<div class="dda-hint-msg dda-opacity-fade" style="opacity: 0;">' + opts["hint"]["message"] + '</div>');
        const _icon = $('<div class="dda-hint-icon">' + opts["hint"]["icon"] + '</div>');
        const _hint = $('<div class="dda-hint"></div>');
        _hint.append(_message);
        _hint.append(_icon);
        container.append(_hint);

        let _hideTimer = undefined;

        const self = this;
        _icon.mouseover(() => {
            self.show();
        });

        _icon.mouseout(() => {
            self.hide();
        });

        $(opts["draggable"]).mouseover(() => {
            self.show();
        });

        /** Public method**/

        /** Show the hint **/
        this.show = function (icon, message) {
            clearTimeout(_hideTimer);
            if (icon) {
                _icon.html(icon);
            }
            if (message) {
                _message.html(message);
            }
            _message.css("opacity", 1);
            _hideTimer = setTimeout(() => {
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
    const Popup = function (annotator, container, opts) {

        /** Constructor **/
        const _buttonGroup = $('<div class="dda-popup-buttons"></div>');
        const _buttonRotate = $('<button role="button" class="dda-popup-button-rotate" data-toggle="tooltip" title="' + opts["popup"]["tooltipRotate"] + '">' + opts["popup"]["buttonRotate"] + '</button>');
        const _buttonRemove = $('<button role="button" class="dda-popup-button-remove" data-toggle="tooltip" title="' + opts["popup"]["tooltipRemove"] + '">' + opts["popup"]["buttonRemove"] + '</button>');
        _buttonGroup.append(_buttonRotate);
        _buttonGroup.append(_buttonRemove);

        const _popup = $('<div class="dda-popup"></div>').hide();
        const _textarea = $('<textarea class="dda-popup-textarea" data-toggle="tooltip" title="' + opts["popup"]["tooltipTextarea"] + '" placeholder = "' + opts["popup"]["placeholderTextarea"] + '"></textarea>');
        const _text = $('<div class="dda-popup-text" data-toggle="tooltip" title="' + opts["popup"]["tooltipText"] + '"></div>');
        _popup.append($('<div></div>').append(_textarea));
        _popup.append(_text);
        _popup.append(_buttonGroup);
        container.append(_popup);

        let _mouseIsAbove = false;
        let _cachedAnnotation = undefined;

        const self = this;
        _popup.mouseover(() => _mouseIsAbove = true);
        _popup.mouseout(() => _mouseIsAbove = false);

        _buttonRotate.click(() => {
            annotator.startRotateAnnotation(_cachedAnnotation);
        });
        _buttonRemove.click(() => {
            annotator.removeAnnotation(_cachedAnnotation);
        });
        _textarea.keyup(() => {
            annotator.editTextAnnotation(_cachedAnnotation, _textarea.val());
        });

        /** Public method **/

        /** Show the Popup on specific position **/
        this.show = function (annotation, position) {
            _cachedAnnotation = annotation;
            if (_cachedAnnotation.text) {
                _text.show().html(_cachedAnnotation.text);
            } else {
                _text.hide();
            }

            if (_cachedAnnotation.editable === AnnotationEdits.FULL) {
                _text.hide();
                _textarea.show().prop("disabled", false).removeAttr('style').val(_cachedAnnotation.text);
            } else {
                _textarea.hide().prop("disabled", true);
            }

            if (_cachedAnnotation.editable !== AnnotationEdits.DISABLED) {
                _buttonGroup.show();
            } else {
                _buttonGroup.hide();
            }

            _popup.css({top: position.y, left: position.x}).show();
        };

        /** Hide the Popup if there is no interaction or force to hide **/
        this.hide = function (force = false) {
            if (self.isHidden() || (!isTouch && _mouseIsAbove && !force)) return;
            const timer = setTimeout(() => {
                if (isTouch || !_mouseIsAbove || force) {
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
    const Annotator = function (container, opts, fireEventFn) {

        /** Constructor **/
        const _canvas = $('<canvas class="dda-canvas"></canvas>');
        container.append(_canvas);

        const _popup = new Popup(this, container, opts);
        const _hint = new Hint(container, opts);

        /**
         * The annotations
         * @type {Annotation[]}
         * @private
         */
        let _annotations = [];

        /**
         *
         * @type {(coordinate: {x: number, y: number}|undefined) => {new: Annotation, old_print: object}|undefined}
         * @private
         */
        let _editAnnotationFn = undefined;

        /**
         * The dragged Annotation
         * @type {Annotation|undefined}
         * @private
         */
        let _draggedAnnotation = undefined;

        /**
         * Active annotation
         * @type {Annotation|undefined}
         * @private
         */
        let _currentAnnotation = undefined;
        const _ctx = _canvas[0].getContext("2d");

        const self = this;
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
                        ui.draggable.attr("annotation-rotation")
                    ),
                    ui.draggable.attr("annotation-editable")
                );
            },
            out: function (event, ui) {
                if (ui.helper.is(":hidden")) ui.helper.show();
                _draggedAnnotation = undefined;
                self.redrawAnnotations();
            }
        });

        _canvas.mousemove(event => {
            const coordinate = _toOriginalCoord(event.offsetX, event.offsetY);
            fireEventFn(Events.MOUSE_MOVE_ANNOTATABLE_ITEM, printCoordinate(coordinate));

            if (_draggedAnnotation) {
                self.redrawAnnotations();
                _draggedAnnotation.geometry.update(coordinate);
                _drawAnnotation(_draggedAnnotation);
                return;
            }

            if (_editAnnotationFn) {
                _editAnnotationFn(coordinate);
                return;
            }

            let topAnnotation = _getAnnotationAt(coordinate);
            if (topAnnotation.length === 0) {
                _currentAnnotation = undefined;
                _canvas.css('cursor', 'default');
                _popup.hide();
                self.redrawAnnotations();
                return;
            }

            if (_popup.isHidden() || _currentAnnotation !== topAnnotation[0]) {
                if (_currentAnnotation !== topAnnotation[0]) {
                    _currentAnnotation = topAnnotation[0];
                    if (_hint.show) _hint.show(opts["hint"]["iconMove"], opts["hint"]["messageMove"]);
                    _canvas.css('cursor', 'move');
                    self.redrawAnnotations(_currentAnnotation);
                }
                _popup.show(_currentAnnotation, _getPopupPosition());
            }
        });

        _canvas.mouseup(() => {
            if (_editAnnotationFn) {
                const edited = _editAnnotationFn();
                fireEventFn(Events.ANNOTATION_UPDATED, [edited.new.print(), edited.old_print]);
                _editAnnotationFn = undefined;
            }
            touchStarted = false;
        });

        _canvas.mousedown(event => {
            if (isTouch && !touchStarted) {
                touchStarted = true;
                event.type = "mousemove";
                _canvas.trigger(event);
            }

            if (!_currentAnnotation || _editAnnotationFn) {
                return;
            }

            if (!isTouch) {
                _popup.hide(true);
            }

            const old_annotation = _currentAnnotation.print();

            let offsetOfCenter = _toOriginalCoord(event.offsetX, event.offsetY);
            offsetOfCenter = {
                x: offsetOfCenter.x - _currentAnnotation.geometry.center.x,
                y: offsetOfCenter.y - _currentAnnotation.geometry.center.y
            };

            _editAnnotationFn = function (coordinate) {
                if (coordinate) {
                    const newCoordinate = {x: coordinate.x - offsetOfCenter.x, y: coordinate.y - offsetOfCenter.y};

                    if (isTouch && newCoordinate.x !== _currentAnnotation.geometry.center.x && newCoordinate.y !== _currentAnnotation.geometry.center.y) {
                        _popup.hide();
                    }

                    _currentAnnotation.geometry.update({
                        x: newCoordinate.x,
                        y: newCoordinate.y
                    });
                    self.redrawAnnotations(_currentAnnotation);
                }
                return {new: _currentAnnotation, old_print: old_annotation};
            };
        });

        /** Private method **/

        /**
         * Transform the resized coordinate to original coordinate
         * @param {number} x
         * @param {number} y
         * @returns {{x: number, y: number}}
         * @private
         */
        const _toOriginalCoord = function (x, y) {
            return {
                x: parseInt((x / _canvas.width()) * _canvas[0].width),
                y: parseInt((y / _canvas.height()) * _canvas[0].height)
            };
        };

        /** Transform the original coordinate to resized coordinate **/
        const _fromOriginalCoord = function (x, y) {
            return {
                x: parseInt((x * _canvas.width()) / _canvas[0].width),
                y: parseInt((y * _canvas.height()) / _canvas[0].height)
            };
        };

        /**
         * Get the UI coordinate on drag & drop
         * @param {number} oLeft
         * @param {number} oTop
         * @returns {{x: number, y: number}}
         * @private
         */
        const _getUiCoordinate = function (oLeft, oTop) {
            return _toOriginalCoord((oLeft - _canvas.offset().left), (oTop - _canvas.offset().top));
        };

        /** Get the popup position from the current annotation **/
        const _getPopupPosition = function () {
            if (!_currentAnnotation) {
                return;
            }
            const loverVertex = _currentAnnotation.geometry.getLowerVertex();
            return _fromOriginalCoord(loverVertex.x, loverVertex.y);
        }

        /**
         * Draw an annotation
         * @param {Annotation} annotation
         * @param {boolean} highlight
         * @private
         */
        const _drawAnnotation = function (annotation, highlight = false) {
            const x = -annotation.geometry.width / 2, y = -annotation.geometry.height / 2;

            _ctx.save();
            _ctx.beginPath();

            _ctx.translate(annotation.geometry.center.x, annotation.geometry.center.y);
            _ctx.rotate(-annotation.geometry.rotation * Math.PI / 180);

            if (annotation.image) {
                _ctx.drawImage(annotation.image, x, y, annotation.geometry.width, annotation.geometry.height);
            }

            if (!annotation.image || opts["annotationStyle"]["imageBorder"]) {
                let borderSize, borderColor;
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

        /**
         * Returns the annotations that have the coordinate inside
         * @param {{x: number, y: number}} coordinate
         * @returns {Annotation[]}
         * @private
         */
        const _getAnnotationAt = function (coordinate) {
            let intersectedAnnotations = [];
            _annotations.forEach(annotation => {
                if (annotation.geometry.intersect(coordinate.x, coordinate.y)) {
                    intersectedAnnotations.push(annotation);
                }
            });
            intersectedAnnotations = intersectedAnnotations.reverse();

            return intersectedAnnotations;
        };

        /** Public method**/

        /**
         * Resize the Viewer
         * @param {number} width
         * @param {number} height
         */
        this.resize = function (width, height) {
            _canvas[0].width = width;
            _canvas[0].height = height;
        };

        /** Clear all drawings **/
        this.clear = function () {
            _ctx.clearRect(0, 0, _canvas[0].width, _canvas[0].height);
        };

        /**
         * Redraw the annotations
         * @param {Annotation|undefined} annotationToHighlight
         */
        this.redrawAnnotations = function (annotationToHighlight = undefined) {
            self.clear();
            let foregroundAnno = undefined;
            _annotations.forEach(annotation => {
                const isEqual = (!annotationToHighlight) ? false : ((annotationToHighlight instanceof Object) ? (annotation === annotationToHighlight) : annotation.id === annotationToHighlight);
                if (isEqual && opts["annotationStyle"]["foreground"]) {
                    if (foregroundAnno) _drawAnnotation(foregroundAnno, true);
                    foregroundAnno = annotation;
                    return;
                }
                _drawAnnotation(annotation, isEqual);
            });
            if (foregroundAnno) {
                _drawAnnotation(foregroundAnno, true);
            }
        };

        /** Returns all annotations **/
        this.getAnnotations = function () {
            return _annotations;
        }

        /** Add a new annotation  **/
        this.addAnnotation = function (annotation, annotationReplaced = undefined, fireEvent = true) {
            if (annotationReplaced) {
                const index = _annotations.indexOf(annotationReplaced);
                if (index > -1) {
                    _annotations[index] = annotation;
                    self.redrawAnnotations();
                }
                return;
            }

            //push annotations sorted by decreasing area
            let isLast = true;
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

        /**
         * Rotate the annotation
         * @param {Annotation} annotation
         */
        this.startRotateAnnotation = function (annotation) {
            if (annotation.editable === AnnotationEdits.DISABLED) {
                return;
            }

            _popup.hide(true);
            if (_hint.show) {
                _hint.show(opts["hint"]["iconRotate"], opts["hint"]["messageRotate"]);
            }
            _canvas.css('cursor', 'default');
            const old_annotation = annotation.print();

            let startRotation;
            _editAnnotationFn = function (coordinate) {
                if (coordinate) {
                    const rotation = Math.atan2(coordinate.y - annotation.geometry.center.y, coordinate.x - annotation.geometry.center.x) * 180 / Math.PI;
                    annotation.geometry.update(
                        undefined,
                        annotation.geometry.rotation + (startRotation - rotation)
                    );
                    startRotation = rotation;
                    self.redrawAnnotations(annotation);
                }
                return {new: annotation, old_print: old_annotation};
            };
        };

        /**
         * Remove the annotation
         * @param {Annotation} annotation
         * @param {boolean} fireEvent
         */
        this.removeAnnotation = function (annotation, fireEvent = true) {
            if (annotation.editable === AnnotationEdits.DISABLED) {
                return;
            }

            _popup.hide(true);
            _annotations.splice(_annotations.indexOf(annotation), 1);
            if (fireEvent) {
                fireEventFn(Events.ANNOTATION_REMOVED, [annotation.print()]);
            }
            self.redrawAnnotations();
        };

        /**
         * Remove all annotations
         * @param {number|undefined} id
         */
        this.removeAll = function (id = undefined) {
            if (id) {
                _annotations = _annotations.filter(annotation => annotation.id !== id);
                self.redrawAnnotations();
                return;
            }
            _annotations = [];
            self.clear();
        };

        /**
         * Edit the annotation text
         * @param {Annotation} annotation
         * @param {string} newText
         * @param {boolean} fireEvent
         */
        this.editTextAnnotation = function (annotation, newText, fireEvent = true) {
            if (annotation.editable !== AnnotationEdits.FULL) {
                return;
            }

            const old_print = annotation.print();
            annotation.text = newText;
            if (fireEvent) fireEventFn(Events.ANNOTATION_UPDATED, [annotation.print(), old_print]);
        };
    };

    /** External API **/

    /**
     * Annotable
     * @param {Image} image
     * @param {Object} opts options
     */
    const Annotable = function (image, opts) {

        /** Constructor **/
        this.image = (image instanceof $) ? image : $(image);
        if (!this.image[0] instanceof Image) {
            $.error('Annotable it must be an image.');
        }
        this.image.wrap($('<div class="dda-annotationlayer"></div>'));

        const self = this;
        const _annotator = new Annotator(this.image.parent(), opts, function (event, arg) {
            self.image.trigger(event, arg);
        });

        if (this.image[0].complete) {
            _annotator.resize(this.image[0].naturalWidth, this.image[0].naturalHeight);
        } else {
            this.image[0].onload = function () {
                _annotator.resize(this.naturalWidth, this.naturalHeight);
            };
        }

        /** Private method **/

        /**
         * Add the Annotation from Annotation Printed
         * @param {object} annotationPrinted
         * @param {HTMLImageElement|object} image
         * @param {object} annotationReplaced
         * @private
         */
        const _addAnnotation = function (annotationPrinted, image, annotationReplaced) {
            const replace = (annotationReplaced) ? _findAnnotation(annotationReplaced) : undefined;
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

        /**
         * Find the Annotation from Annotation Printed
         * @param {object} annotationPrinted
         * @returns {Annotation}
         * @private
         */
        const _findAnnotation = function (annotationPrinted) {
            const annotation = _annotator.getAnnotations().find(annotation => {
                return annotation.isEqualPrint(annotationPrinted);
            });
            if (!annotation) $.error("Annotation not found.");
            return annotation;
        };

        /** Public method **/

        /**
         * Adds a new annotation, or replaces an existing one.
         * In the latter case, the parameter annotationReplaced is the annotation to replace
         * @param {object} annotationPrinted
         * @param {object|undefined} annotationReplaced
         */
        this.addAnnotation = function (annotationPrinted, annotationReplaced = undefined) {
            if (!annotationPrinted["position"] ||
                !annotationPrinted["position"]["center"] ||
                !annotationPrinted["position"]["center"]["x"] ||
                !annotationPrinted["position"]["center"]["y"]
            ) $.error('Invalid annotation.');

            if (annotationPrinted["image"]) {
                if (annotationPrinted["image"] instanceof Image) _addAnnotation(annotationPrinted, annotationPrinted["image"], annotationReplaced);
                else {
                    if (!annotationPrinted["image"] instanceof String || !annotationPrinted["image"].includes("http")) {
                        $.error('Image must be a URL or an instance of Image.');
                    }
                    const image = new Image();
                    image.src = annotationPrinted["image"];
                    image.onload = function () {
                        _addAnnotation(annotationPrinted, this, annotationReplaced);
                    };
                }
            } else {
                _addAnnotation(annotationPrinted, {}, annotationReplaced);
            }
        };

        /** Returns an array of annotations **/
        this.getAnnotations = function () {
            /**
             * The current annotations
             * @type {Annotation[]}
             */
            const annotationsPrinted = [];
            _annotator.getAnnotations().forEach(annotation => {
                annotationsPrinted.push(annotation.print());
            });
            return annotationsPrinted;
        };

        /**
         * Removes an annotation
         * @param {object} annotationPrinted
         */
        this.removeAnnotation = function (annotationPrinted) {
            _annotator.removeAnnotation(_findAnnotation(annotationPrinted), false);
        };

        /**
         * Removes all annotations
         * @param {number|undefined} id
         */
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

        /**
         * Highlights the specified annotation, just as if the mouse pointer was hovering over it
         * @param {Annotation|object} annotationPrinted
         */
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
        let opts = {};
        let instances = undefined;
        if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            opts = $.extend(true, {}, $.fn.annotable.defaults, methodOrOptions);
            instances = (this.length > 1) ? [] : undefined;

            if (!$(opts["draggable"]).is(":ui-draggable")) {
                $(opts["draggable"]).draggable({
                    helper: 'clone',
                    ghosting: true,
                    cursorAt: {top: 0, left: 0},
                    revert: 'invalid',
                    start: function () {
                        touchStarted = true;
                    },
                    stop: function () {
                        touchStarted = false;
                    }
                });
            }
        }

        const args = Array.prototype.slice.call(arguments, 1);
        this.each(function () {
            let item = $(this), instance = item.data('annotable');
            if (!instance) {
                if (opts) {
                    instance = new Annotable(this, opts);
                    item.data('annotable', instance);

                    if (!instances) {
                        instances = instance;
                    } else {
                        instances.push(instance);
                    }

                } else $.error('Annotable is not initialized.');
            } else if (typeof methodOrOptions === 'string' && instance[methodOrOptions]) {
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
            "tooltipTextarea": "Text of annotation", //tooltip of annotation textarea input
            "placeholderTextarea": "Enter Text", //placeholder of annotation textarea input
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
