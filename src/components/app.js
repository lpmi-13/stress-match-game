import { h, Component } from 'preact';
import { Router } from 'preact-router';

import { setupPath } from '../utils';
import Home from '../routes/home';
import Game from '../routes/game';
import Loss from '../routes/loss';
import Select from '../routes/select';
import Win from '../routes/win';

export default class App extends Component {
  state = {
    selectedStress: '',
  };

  selectStress = selectedStress => this.setState({ selectedStress });

  render() {
    return (
      <div id="app">
        <Router onChange={this.handleRoute}>
          <Home path={`${setupPath()}/`} />
          <Game path={`${setupPath()}/game`} stress={this.state.selectedStress} />
          <Loss path={`${setupPath()}/loss`} />
          <Select path={`${setupPath()}/select`} onSelectStress={this.selectStress} />
          <Win path={`${setupPath()}/win`} />
        </Router>
      </div>
    );
  }
}
