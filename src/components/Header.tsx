import * as React from "react";
import { connect } from 'react-redux'
import { Icon, Popover, Menu, MenuItem, MenuDivider, Position, Button } from '@blueprintjs/core';
import * as myActions from '../redux/Actions'
import { bindActionCreators } from 'redux'
import Router from '../core/Router'
import { KeyCodes } from '../common/Constants'

interface IHeaderProps {
    // dispatch?: Function
    doSearch?: Function
}

interface IHeaderState {
    search: string
}

class Header extends React.Component<IHeaderProps, IHeaderState> {

    constructor() {
        super();
        this.state = {
            search: ''
        };
    }

    back() {
        if (!Router.is.Home()) {
            window.history.back()
        }
    }

    home() {
        if (!Router.is.Home()) {
            Router.to.Home();
        }
    }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ search: event.currentTarget.value })
    }

    handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.keyCode === KeyCodes.Enter) {
            this.onSearch();
        }
    }

    handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.keyCode === KeyCodes.Escape) {
            this.onSearch();
        }
    }

    onSearch = () => {
        this.props.doSearch(this.state.search)
    }

    onClear = () => {
        this.setState({ search: '' })
        this.props.doSearch('')
    }

    public renderMenu() {
        return (
            <Menu>
                {/* <MenuItem
                    iconName="comparison"
                    onClick={() => Router.to.Duplicates()}
                    text="Duplicates"
                />
                <MenuItem
                    iconName="trash"
                    onClick={() => Router.to.CleanUp()}
                    text="Clean up"
                />
                <MenuDivider /> */}
                <MenuItem
                    text="Settings"
                    iconName="cog"
                    onClick={() => Router.to.Settings()}
                />
            </Menu>
        );
    }

    render() {
        return (
            <nav className="pt-navbar pt-dark">
                <div className="pt-navbar-group pt-align-left">
                    <button className="pt-button pt-minimal pt-icon-chevron-left" onClick={this.back}></button>
                    {/* <Icon className='nav-button' iconName='pt-icon-chevron-left' onClick={this.back} /> */}
                    {/* <Icon className='nav-button home' iconName='pt-icon-home' onClick={this.home} /> */}
                    <button className="pt-button pt-minimal pt-icon-home" onClick={this.home}>Home</button>
                    <input className="pt-input" type="text" placeholder="Search" dir="auto" id='search-input'
                        onChange={this.handleChange}
                        onKeyDown={this.handleKeyDown}
                        onKeyUp={this.handleKeyUp}
                        value={this.state.search} />
                    <button className="pt-button pt-minimal pt-icon-search" onClick={this.onSearch}></button>
                    <button className="pt-button pt-minimal pt-icon-cross" onClick={this.onClear}></button>
                </div>
                <div className="pt-navbar-group pt-align-right">
                    <Popover content={this.renderMenu()} position={Position.BOTTOM_RIGHT}>
                        <button className="pt-button pt-minimal pt-icon-menu"></button>
                    </Popover>
                </div>
            </nav>
        );
    }
}

function mapStateToProps(state, ownProps): IHeaderProps {
    return {
    }
}

function mapDispatchToProps(dispatch): IHeaderProps {
    return {
        doSearch: value => dispatch(myActions.search(value))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);