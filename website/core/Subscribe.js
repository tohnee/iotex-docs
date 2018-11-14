/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Subscribe extends React.Component {
  render() {
    const header = this.props.header;
    const title = this.props.title||'Stay updated with our latest progress, news, events and community reward programs!';
    const hint = this.props.hint||'email@example.com';
    return (
      <div className="subscribleForm">
        {header&&(<h3>{header}</h3>)}
        <span>{title}</span>
        <form
          action='//network.us16.list-manage.com/subscribe/post?u=2f676e23e08fa3633f66ebc89&amp;id=b7930ab8b9'
          method='post'
          id='mc-embedded-subscribe-form'
          name='mc-embedded-subscribe-form'
          className='validate'
          target='_blank'
          noValidate={false}
        >
          <input
            type='email'
            aria-label='Email'
            id='mce-EMAIL'
            name='EMAIL'
            placeholder={hint}
            required={true}
          />
          <input type='hidden' name='b_2f676e23e08fa3633f66ebc89_b7930ab8b9' tabIndex='-1' value=''/>
          <button>SUBSCRIBE</button>
        </form>
      </div>
    );
  }
}

module.exports = Subscribe;
