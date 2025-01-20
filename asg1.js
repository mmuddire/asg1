// Vertex shader program
var VS = `
    attribute vec4 a_Position;
    uniform float u_Size;
    void main(){
        gl_Position = a_Position;
        gl_PointSize =  u_Size;
    }`;


// Fragment shader program
var FS = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main(){
        gl_FragColor = u_FragColor;
    }`;

// Global vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
  
function setUpWegGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
  
    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});

    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
}

function connectVariablesToGLSL(){
    if(!initShaders(gl, VS, FS)){
        console.log("Failed to load/compile shaders");
        return;
        }
    
    a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if(a_Position < 0){
        console.log("Failed to get the storage location of a_Position");
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if(!u_FragColor){
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }

    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if(!u_Size){
        console.log("Failed to get the storage location of u_Size");
        return;
    }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_selectedSegments=50;

function addActionsForHtmlUI(){
    document.getElementById('red').onclick = function() {g_selectedColor = [1.0, 0.0,0.0, 1.0]; };
    document.getElementById('green').onclick = function() {g_selectedColor = [0.0, 1.0,0.0, 1.0]; };
    document.getElementById('blue').onclick = function() {g_selectedColor = [0.0, 0.0,1.0, 1.0]; };
    
    document.getElementById('clearButton').onclick = function() {g_shapesList = []; renderAllShapes(); };

    document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
    document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
    document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};    

    document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; });

    document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value; });

    document.getElementById('segmentSlide').addEventListener('mouseup', function() {g_selectedSegments = this.value; });


}

function main() {
    setUpWegGL();

    connectVariablesToGLSL();

    addActionsForHtmlUI();

    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) {if(ev.buttons == 1) {click(ev)}};
  
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    
  }



var g_shapesList = [];

function click(ev){
    let [x,y] = convertCoordinatedEventToGL(ev);

    let shape; 
    if(g_selectedType==POINT){
        shape = new Point();
    } else if (g_selectedType==TRIANGLE) {
        shape = new Triangle();
    } else {
        shape = new Circle();
        shape.segments = g_selectedSegments;
        
    }
    shape.position=[x,y];
    shape.color=g_selectedColor.slice();
    shape.size=g_selectedSize;
    g_shapesList.push(shape);

    renderAllShapes();
    
}

function convertCoordinatedEventToGL(ev){
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x,y]);
}

function renderAllShapes(){

    var startTime = performance.now();

    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_shapesList.length;
    for(var i = 0; i < len; i++){
        g_shapesList[i].render();
    }

    var duration = performance.now() - startTime;
    sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps:  " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm){
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

