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
  },
  canvas: {
    width: "100%",
    height: "100%",
  }
});

class SketchDemo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      srcPath: A_1,
      resPath: [],
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
        if(age === 100) {
          this.setState({age: 0})
        } else {        
          this.setState({age: age + 1})
        }
        this.transformLetter();
      }
    }, 200)
  }

  transformLetter = () => {
    const {age, text} = this.state;
    let resPath = [];

    for(let c of text) {
      resetSeed(this.state.seed);
      
      var srcPath = parsePath(CHARS[c]);

      // randomization parameters
      let magn = new Vector2D(
        age * 1.0 + random() * 3, 
        age * 0.5 + random() * 2
      );
      let roundingMagnitude = age + random() * 3;

      var circles = [];
      var lines = [];

      let { points, normals } = analyzePath(srcPath);

      // rounden path
      let newPath = rounden(srcPath, points, normals, roundingMagnitude);

      // stretch
      newPath = stretch(newPath, points, normals, magn)    

      // smooth path
      let newPathSmoothed = smoothPath(newPath, 0.15)

      // roughen path
      let roughPath = roughenPath(newPathSmoothed, age * 8/100);

      // smooth roughened again
      roughPath = smoothPath(roughPath, 0.15);

      // crack points overlay
      roughPath = crackPoints(roughPath, age);

      resPath.push(writePath(roughPath));
    }
    
    this.setState({
      resPath: resPath,
      circles: circles,
      lines: lines
    })
  }

  handleSelect = (e) => {
    this.setState({
      srcPath: e.target.value,
    });
    setTimeout(() => this.transformLetter(), 100);
  }

  render(){
    const {classes} = this.props;
    const {srcPath, resPath} = this.state;

    return (
      <div className="App">
        <Typography variant="h5">SketchDemo:</Typography>
        <Button onClick={() => {
          this.setState({seed: Math.random() * 100});      
          setTimeout(() => this.transformLetter(), 10);
        }}>Shuffle</Button>
        <TextField value={this.state.text} onChange={(e) => {
          this.setState({text: e.target.value});
          setTimeout(() => this.transformLetter(), 10);
        }} />
        <Button onClick={() => this.setState({play: !this.state.play})}>{this.state.play ? "Pause": "Play"}</Button>
        <Slider value={this.state.age} onChange={(e)=>{
          this.setState({age: e});
          setTimeout(() => this.transformLetter(), 10);
        }}></Slider>
        <Typography variant="h5">Result:</Typography>
        <Grid container className={classes.transformContainer}>
          <Grid item xs={12}>
            <svg viewBox={"1000 800 " + (1000 * resPath.length) + " 1500"}>
              {resPath.map((path, index) => (
                <path transform={"translate(" + (1000 * index) + ", 0)"} d={path}/> 
              ))}   
            </svg>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(SketchDemo);
