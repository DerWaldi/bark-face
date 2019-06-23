import React, { Component } from 'react';
import './App.css';
import { Grid, Typography, Select, Button, MenuItem } from '@material-ui/core';
import { A_1, A_2, A_ALL, A_ALTERNATIVE_1, E_1, B_1, D_1, F_1, H_1, K_1, L_1, N_1, T_1, U_1 } from './examples';
import { withStyles } from '@material-ui/styles';
import { parsePath, writePath } from './svg/SVGUtils';
import { Vector2D, analyzePath, pathToPoints, smoothPath, insidePolygon, crackPoints, getSubPaths, roughenPath, stretch, rounden } from './svg/geometry';
import { Slider } from 'material-ui-slider';

const styles = theme => ({
  transformContainer: {
    height: 700,
  },
  canvas: {
    width: "100%",
    height: "100%",
  }
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      srcPath: A_1,
      resPath: A_2,
      circles: [],
      lines: [],
      age: 0
    }
  }

  componentDidMount() {    
    this.transformLetter();
  }

  transformLetter = () => {
    const {age} = this.state;
    // randomization parameters
    let magn = new Vector2D(
      age * 1.0 + Math.random() * 3, 
      age * 0.5 + Math.random() * 2
    );
    let roundingMagnitude = age + Math.random() * 3;

    var srcPath = parsePath(this.state.srcPath);
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
    
    this.setState({
      resPath: writePath(roughPath),
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
    const {srcPath, resPath, circles, lines} = this.state;

    const svgText = '<svg viewBox="1000 800 1000 1500"><path d="' + resPath + '"/><path d="' + srcPath + '" fill="#ffff00"/>  </svg>'
    return (
      <div className="App">
        <Typography variant="h5">Calculation:</Typography>
        <Slider defaultValue={this.state.age} onChange={(e)=>{
          this.setState({age: e});
          setTimeout(() => this.transformLetter(), 10);
        }}></Slider>
        <Select value={srcPath}
          onChange={this.handleSelect}>
          <MenuItem value={A_1}>A</MenuItem>
          <MenuItem value={B_1}>B</MenuItem>
          <MenuItem value={D_1}>D</MenuItem>
          <MenuItem value={E_1}>E</MenuItem>
          <MenuItem value={F_1}>F</MenuItem>
          <MenuItem value={H_1}>H</MenuItem>
          <MenuItem value={K_1}>K</MenuItem>
          <MenuItem value={L_1}>L</MenuItem>
          <MenuItem value={N_1}>N</MenuItem>
          <MenuItem value={T_1}>T</MenuItem>
          <MenuItem value={U_1}>U</MenuItem>
        </Select>
        <Button onClick={this.transformLetter}>Refresh</Button>
        <Button href={"data:text/plain;charset=utf-8," + encodeURIComponent(svgText)} download="test.svg">Download</Button>
        <Grid container className={classes.transformContainer}>
          <Grid item xs={12}>
            <svg viewBox="1000 800 1000 1500">
              <path d={resPath}/>    
              <path d={srcPath} fill="#ffff0090"/>          
              {lines.map((c, index) => (
                <line key={"l" + index} x1={c.x0} y1={c.y0} x2={c.x1} y2={c.y1} stroke={c.stroke}/>
              ))} 
              {circles.map((c, index) => (
                <circle key={"c" + index} cx={c.x} cy={c.y} r={c.r} fill={c.fill}/>
              ))} 
            </svg>
          </Grid>
        </Grid>
        <Typography variant="h5">Examples:</Typography>
        <Grid container>
          {A_ALL.map((c, index) => (
            <Grid key={index} item xs={2}>
              <svg viewBox="500 500 2000 2500">
                <path d={c}/>
              </svg>
            </Grid>
          ))} 
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(App);
