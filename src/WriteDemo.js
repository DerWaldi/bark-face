import React, { Component } from 'react';
import { Grid, Typography, Button, TextField, IconButton, FormHelperText } from '@material-ui/core';
import { A_1, CHARS } from './examples';
import { withStyles } from '@material-ui/styles';
import { parsePath, writePath } from './svg/SVGUtils';
import { Vector2D, analyzePath, smoothPath, crackPoints, roughenPath, stretch, rounden } from './svg/geometry';
import { Slider } from 'material-ui-slider';
import { resetSeed, random } from './svg/random';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDice, faDownload } from '@fortawesome/free-solid-svg-icons'

const styles = () => ({
  transformContainer: {
    height: 700,
  },
  canvas: {
    width: "100%",
    height: "100%",
  },
  downloadBtn: {
    position: "absolute",
    top: 80,
    right: 20,
  }
});

const maxAge = 80;

class WriteDemo extends Component {
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
        if(age === maxAge) {
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
        age * 2.0 + random() * 3, 
        age * 1.0 + random() * 2
      );
      let roundingMagnitude = age + random() * 3;
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

      resPath.push(writePath(newPath));
    }
    
    this.setState({
      resPath: resPath
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

    const svgText = '<svg viewBox="1000 800 ' + (1000 * resPath.length) + ' 1500">' + 
      resPath.map((path, index) => '<path transform="translate(' + (1000 * index) + ', 0)" d="' + path + '" />').join() + 
      ' </svg>';

    return (
      <div className="App">
        <Grid container>
          <Grid item xs={3} style={{padding: 20}}>
            <Typography variant="h5">Parameters:</Typography>

            <IconButton onClick={() => {
              this.setState({seed: Math.random() * 100});      
              setTimeout(() => this.transformLetter(), 10);
            }}><FontAwesomeIcon icon={faDice}/></IconButton>

            <TextField fullWidth label="Engraved Text:" value={this.state.text} onChange={(e) => {
              this.setState({text: e.target.value.toUpperCase()});
              setTimeout(() => this.transformLetter(), 10);
            }} />
            <br/>
            <FormHelperText>Age</FormHelperText>
            <Slider value={this.state.age} min={0} max={maxAge} onChange={(e)=>{
              this.setState({age: e});
              setTimeout(() => this.transformLetter(), 10);
            }}></Slider>

            <Button onClick={() => this.setState({play: !this.state.play})}>{this.state.play ? "Pause": "Play Animation"}</Button>
          </Grid>
          <Grid item xs={9} className={classes.transformContainer} style={{padding: 20}}>
            <Typography variant="h5">{"Result after approx. " + this.state.age + " years:"}</Typography>
            <svg viewBox={"1000 800 " + (1000 * resPath.length) + " 1500"} style={{maxHeight: 700}}>
                {resPath.map((path, index) => (
                  <path transform={"translate(" + (1000 * index) + ", 0)"} d={path}/> 
                ))}   
            </svg>            
            <IconButton href={"data:text/plain;charset=utf-8," + encodeURIComponent(svgText)} download="bark.svg" className={classes.downloadBtn}>
              <FontAwesomeIcon icon={faDownload} />
            </IconButton>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(WriteDemo);
