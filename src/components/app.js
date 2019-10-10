import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Home from '../routes/home';
import Game from '../routes/game';
import Loss from '../routes/loss';
import Select from '../routes/select';
import Win from '../routes/win';

export default class App extends Component {
  state = {
    selectedRhyme: '',
  };

  selectRhyme = selectedRhyme => this.setState({ selectedRhyme });

  render() {
    return (
      <div id="app">
        <Router onChange={this.handleRoute}>
          <Home path="/rhyme-game/" />
          <Game path="/rhyme-game/game" rhyme={this.state.selectedRhyme} />
          <Loss path="/rhyme-game/loss" />
          <Select path="/rhyme-game/select" onSelectRhyme={this.selectRhyme} />
          <Win path="/rhyme-game/win" />
        </Router>
      </div>
    );
  }
}
