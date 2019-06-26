import React, { Component } from 'react';
import { Grid, Typography, Button, TextField } from '@material-ui/core';
import { A_1, CHARS } from './examples';
import { withStyles } from '@material-ui/styles';
import { parsePath, writePath } from './svg/SVGUtils';
import { Vector2D, analyzePath, smoothPath, crackPoints, roughenPath, stretch, rounden } from './svg/geometry';
import { Slider } from 'material-ui-slider';
import { resetSeed, random } from './svg/random';

const styles = () => ({
  transformContainer: {
    height: 700,
    cursor: "crosshair",
  },
  canvas: {
    width: "100%",
    height: "100%",
  }
});
const maxAge = 80;

class SketchDemo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      srcPath: "",
      resPath: "",
      circles: [],
      lines: [],
      age: 0,
      play: false,
      text: "TEST",
      seed: 42
    }
  }

  componentDidMount() {    
    this.transformLetter();
    setInterval(() => {
      const {age, play} = this.state;
      if(play) {
        if(age === 80) {
          this.setState({ play: false})
        } else {        
          this.setState({age: age + 1})
        }
        this.transformLetter();
      }
    }, 200)
  }

  transformLetter = () => {
    const {age} = this.state;
    let resPath = [];

    resetSeed(this.state.seed);

    if(!this.state.srcPath)
      return;
    
    var srcPath = parsePath(this.state.srcPath);

    // randomization parameters
    let magn = new Vector2D(
      age * 2.0 + random() * 3, 
      age * 1.0 + random() * 2
    );
    let roundingMagnitude = age + random() * 3;

    var lines = [];

    let { points, normals } = analyzePath(srcPath);

    // rounden path
    let newPath = rounden(srcPath, points, normals, roundingMagnitude);

    // stretch
    newPath = stretch(newPath, points, normals, magn)  

    // roughen path
    newPath = roughenPath(newPath, age * 8/maxAge);

    // smooth roughened again
    newPath = smoothPath(newPath, Math.min(0, age - 40) / maxAge * 0.15 + 0.05);

    // crack points overlay
    newPath = crackPoints(newPath, age);
    
    this.setState({
      resPath: writePath(newPath),
      lines: lines
    })
  }

  drawPoints = [];

  getMousePosition(e) {
    let scaleFactor = 3000 / this.canvas.getBoundingClientRect().width;
    return new Vector2D(((e.clientX - this.canvas.getBoundingClientRect().x) * scaleFactor) + 1000, ((e.clientY - this.canvas.getBoundingClientRect().y) * scaleFactor) + 800)
  }

  mouseDown = (e) => {
    let p = this.getMousePosition(e);
    this.drawPoints.push(p);
    this.drawing = true;
  };

  mouseMove = (e) => {
    let p = this.getMousePosition(e);
    if(this.drawing) {
      this.drawPoints.push(p);
    }
  };

  mouseUp = (e) => {
    this.drawing = false;
    let p = this.getMousePosition(e);
    this.drawPoints.push(p);

    let path = parsePath(this.state.srcPath);

    path.push(["M", this.drawPoints[0].x, this.drawPoints[0].y]);
    for(let i = 1; i < this.drawPoints.length; i++) {
      let normalVector = [
        -(this.drawPoints[i].y - this.drawPoints[i-1].y),
        (this.drawPoints[i].x - this.drawPoints[i-1].x)
      ];
      let normalVectorLength = Math.sqrt(normalVector[0] * normalVector[0] + normalVector[1] * normalVector[1]);
      normalVector[0] /= normalVectorLength;
      normalVector[1] /= normalVectorLength;

      path.push(["L", this.drawPoints[i].x + normalVector[0] * 20, this.drawPoints[i].y + normalVector[1] * 20]);
    }
    for(let i = this.drawPoints.length - 1; i > 0; i--) {
      let normalVector = [
        -(this.drawPoints[i].y - this.drawPoints[i-1].y),
        (this.drawPoints[i].x - this.drawPoints[i-1].x)
      ];
      let normalVectorLength = Math.sqrt(normalVector[0] * normalVector[0] + normalVector[1] * normalVector[1]);
      normalVector[0] /= normalVectorLength;
      normalVector[1] /= normalVectorLength;

      path.push(["L", this.drawPoints[i].x - normalVector[0] * 20, this.drawPoints[i].y - normalVector[1] * 20]);
    }
    path.push("z");

    this.drawPoints = [];

    this.setState({
      srcPath: writePath(path),
      resPath: writePath(path),
      play: true,
      age: 0
    });
  };

  render(){
    const {classes} = this.props;
    const {srcPath, resPath, circles} = this.state;

    return (
      <div className="App">
        <Typography variant="h5">Draw Something:</Typography>
        <Grid container className={classes.transformContainer}>
          <Grid item xs={12}>
            <svg ref={c => this.canvas = c} viewBox={"1000 800 3000 1500"} 
              onMouseDown={this.mouseDown}
              onMouseUp={this.mouseUp}
              onMouseMove={this.mouseMove}>
              <path d={resPath}/> 
              {circles.map((c, index) => (
                <circle key={"c" + index} cx={c.x} cy={c.y} r={c.r} fill={c.fill}/>
              ))} 
            </svg>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(SketchDemo);
