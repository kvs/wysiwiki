(function ($) {

  var filters = {};
  var attributes = {};

  // Given a root element and a path of offsets, return the targetted element.
  var navigatePath = function (root, path) {
    path = path.slice(0);
    while (path.length > 0) {
      root = root.childNodes[path.shift()];
    }
    return root;
  }

  // Return the shared elements of 2 arrays from the beginning.
  var arrayPrefix = function (a, b) {
    var sharedlen = Math.min(a.length, b.length), i;
  
    for (i = 0; i < sharedlen; i += 1) {
      if (a[i] !== b[i]) {
        return i;
      }
    }
    if (i < Math.max(a.length, b.length)) {
      return i;
    }
    return true;
  }

  var cons = function (arr, c) {
    var n = arr.slice(0);
    n.push(c);
    return n;
  }

  var checkFilters = function (selectedFilters, a, b) {
    for (f = 0; f < selectedFilters.length; f++) {
      if (filters[selectedFilters[f]].condition(a) && filters[selectedFilters[f]].condition(b)) {
        if (filters[selectedFilters[f]].test(a,b)) {
          return true;
        } else {
          return false;
        }
      }
    }
    return undefined;
  }

  var checkAttributes = function (a, b) {
    var attrs;
    if (attrs = attributes[a.nodeName.toLowerCase()]) {
      for (var i = 0, len = attrs.length; i < len; i++) {
        if ($(a).attr(attrs[i]) !==
              $(b).attr(attrs[i])) {
          return true;
        }
      }
    }
    return false;
  }

  // Scan over two DOM trees a, b and return the first path at which they differ.
  var forwardScan = function (a, b, apath, selectedFilters) {
    // Quick exit.
    if (a.nodeName !== b.nodeName || checkAttributes(a, b)) {
      return apath;
    }
    
    if (selectedFilters) {
      var check = checkFilters(selectedFilters, a, b);
      if (check) {
        return apath;
      } else if (check === false) {
        return false;
      }
    }

    var aNode = a.firstChild, bNode = b.firstChild, ret, i = 0, f;
    
    // Recur nodes
    if (aNode && bNode) {
      do {
        ret = forwardScan(aNode, bNode, cons(apath, i), selectedFilters);
        if (ret) {
          return ret;
        }
        i += 1;
        aNode = aNode.nextSibling;
        bNode = bNode.nextSibling;
      } while (aNode && bNode);
    
      if (aNode || bNode) {
        return cons(apath, i);
      } else {
        return false;
      }
    } else if (aNode || bNode) {
      return apath;
    } else if (a.data) {
      if (a.data === b.data) {
        return false;
      } else {
        return apath;
      }
    } else {
      return false;
    }
  }

  // Scan backwards over two DOM trees a, b and return the paths where they differ
  var reverseScan = function (a, b, apath, bpath, selectedFilters) {
    if (a.nodeName !== b.nodeName || checkAttributes(a, b)) {
      return [apath, bpath];
    }
  
    if (selectedFilters) {
      var check = checkFilters(selectedFilters, a, b);
      if (check) {
        return [apath, bpath];
      } else if (check === false) {
        return false;
      }
    }
    
    var aNode = a.lastChild, bNode = b.lastChild,
      aLen = a.childNodes.length, bLen = b.childNodes.length,
      ret, i = aLen - 1, j = bLen - 1;

    if (aNode && bNode) {
      do {
        ret = reverseScan(aNode, bNode, cons(apath, i), cons(bpath, j), selectedFilters);
        if (ret) {
          return ret;
        }
        i -= 1;
        j -= 1;
        aNode = aNode.previousSibling;
        bNode = bNode.previousSibling;
      } while (aNode && bNode);
    
      if (aNode || bNode) {
        return [cons(apath, i), cons(bpath, j)];
      } else {
        return false;
      }
    } else if (aNode || bNode) {
        return [apath, bpath];
    } else if (a.data) {
      if (a.data === b.data) {
        return false;
      } else {
        return [apath, bpath];
      }
    } else {
      return false;
    }
  }

  // Return a slice of childNodes from a parent.
  var childNodesSlice = function (parentNode, start, end) {
    var arr = [], i = 0, cnode = parentNode.firstChild;
    while (i < start) {
      cnode = cnode.nextSibling;
      i += 1;
    }
    while (i < end) {
      arr.push(cnode);
      cnode = cnode.nextSibling;
      i += 1;
    }
    return arr;
  }

  // Find the difference between two DOM trees, and the operation to change a to b
  var scanDiff = function (a, b, filters) {
    var for_diff = forwardScan(a, b, [], filters);
    if (for_diff === false) {
      return {type: "identical"};
    }

    var rev_diff = reverseScan(a, b, [], [], filters),
      prefixA = arrayPrefix(for_diff, rev_diff[0]),
      prefixB = arrayPrefix(for_diff, rev_diff[1]),
      sourceSegment,
      destSegment;
   
    if (prefixA === true && prefixB === true) {
      sourceSegment = [navigatePath(a, for_diff)];
      destSegment = [navigatePath(b, for_diff)];
    } else {
      var sharedroot = Math.min(prefixA, prefixB),
        pathi = for_diff.slice(0, sharedroot),
        sourceel = navigatePath(a, pathi),
        destel = navigatePath(b, pathi),
        leftPointer = for_diff[sharedroot],
        rightPointerA = rev_diff[0][sharedroot],
        rightPointerB = rev_diff[1][sharedroot];
    
      if (rightPointerA < rightPointerB && leftPointer > rightPointerA) {
        return {
          type: "insert",
          source: {node: sourceel,
            index: leftPointer-1},
          replace: childNodesSlice(destel, leftPointer, leftPointer + (rightPointerB-rightPointerA))
        };
      } else if (leftPointer > rightPointerA || leftPointer > rightPointerB) {
        sourceSegment = childNodesSlice(sourceel, leftPointer, leftPointer + (rightPointerA-rightPointerB));
        destSegment = [];
      } else {
        sourceSegment = childNodesSlice(sourceel, leftPointer, rightPointerA + 1);
        destSegment = childNodesSlice(destel, leftPointer, rightPointerB + 1);
      }
    }
    return {type: "replace", source: sourceSegment, replace: destSegment};
  }
  
  // Use the scan result to patch one DOM tree into the other.
  // This is the only part of the code dependent upon jQuery (as it removes nodes,
  // framework specific data may need to be removed).
  var executePatch = function (patch) {
    
    if (patch.type === "identical") {
      return;
    }
  
    if (patch.type === "insert") {
      if (patch.source.index === -1) {
        $(patch.source.node).prepend(patch.replace);
      } else {
        $($(patch.source.node).contents()[patch.source.index]).after(patch.replace);
      }
      return;
    }
  
    if (patch.type === "replace") {
      $(patch.source[patch.source.length - 1]).after(patch.replace);
      $(patch.source).remove();
    }
  }
  
  var methods = {
    diff: function (targetDOM, filters) {
      var patch = scanDiff(this.get(0), targetDOM.get(0), filters);
      patch.patch = function () {
        executePatch(patch);
      }
      return patch;
    },
    patch: function (targetDOM, filters) {
      var patch = scanDiff(this.get(0), targetDOM.get(0), filters);
      executePatch(patch);
      return patch;
    },
    filter: function (name, condition, test) {
      if (condition && test) {
        filters[name] = {condition: condition, test: test};
      } else {
        delete filters[name];
      }
    },
    attributes: function (newAttributes) {
      if (newAttributes === undefined) {
        return attributes;
      } else {
        attributes = newAttributes;
      }
    }
  }
  
  $.fn.quickdiff = function( method ) {
    // Method calling logic
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } /* else if ( typeof method === 'object' || ! method ) {
      //return methods.init.apply( this, arguments );
    }*/ else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.quickdiff' );
    }
  };

})(jQuery);