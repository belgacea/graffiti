import * as React from "react";
import { connect } from 'react-redux'
import { Icon, Popover, Menu, MenuItem, MenuDivider, Position, Button, Navbar, Alignment, InputGroup } from '@blueprintjs/core';
import * as myActions from '../redux/Actions'
import IState from '../types/IState'
import { bindActionCreators } from 'redux'
import Router from '../core/Router'
import { KeyCodes } from '../common/Constants'
import Search from "../types/Search";
import Video from "../types/Video";

interface IHeaderProps {
    // dispatch?: Function
    doSearch?: Function
    loadVideoDetails?: Function
    searchHistory?: Search[]
    bookmarks?: Video[]
}

interface IHeaderState {
    search: string
}

class Header extends React.Component<IHeaderProps, IHeaderState> {

    constructor(props: any) {
        super(props);
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

    componentWillReceiveProps(nextProps: IHeaderProps) {
        // console.log(nextProps)
    }

    public renderMenu() {
        return (
            <Menu>
                <MenuItem
                    icon="comparison"
                    onClick={() => Router.to.Duplicates()}
                    text="Duplicates"
                />
                <MenuItem
                    icon="trash"
                    onClick={() => Router.to.CleanUp()}
                    text="Clean up"
                />
                <MenuDivider />
                <MenuItem
                    icon="properties"
                    text="Rules"
                    onClick={() => Router.to.Rules()}
                    />
                <MenuItem
                    text="Settings"
                    icon="cog"
                    onClick={() => Router.to.Settings()}
                />
            </Menu>
        );
    }

    renderHistory() {
        const elements = (this.props.searchHistory || []).map(item => <MenuItem key={item.id} text={item.toString()} onClick={() => this.props.doSearch(item.request)} />)
        return (
            <Navbar.Group align={Alignment.RIGHT}>
                <Popover content={ <Menu>{ elements }</Menu> } position={Position.BOTTOM_LEFT}>
                    <Button icon='history' minimal={true} />
                </Popover>
            </Navbar.Group>
        );
    }

    renderBookmarks() {
        const load = (video: Video) => {
            this.props.loadVideoDetails(video._id)
            Router.to.VideoDetails(video._id);
        }
        const elements = (this.props.bookmarks || []).map(video => <MenuItem key={video._id} text={video.getName()} onClick={() => load(video)} />)
        return (
            <Navbar.Group align={Alignment.LEFT}>
                <Popover content={ <Menu>{ elements }</Menu> } position={Position.BOTTOM_RIGHT}>
                    <Button icon='bookmark' minimal={true} />
                </Popover>
            </Navbar.Group>
        );
    }

    render() {
        return (
            <Navbar className="bp3-dark">
                <Navbar.Group align={Alignment.LEFT}>
                    <Button icon='chevron-left' minimal={true} onClick={this.back} />
                    {/* <Icon className='nav-button' icon='chevron-left' onClick={this.back} /> */}
                    {/* <Icon className='nav-button home' icon='home' onClick={this.home} /> */}
                    <Button icon='home' minimal={true} onClick={this.home}>Home</Button>
                    <InputGroup placeholder="Search" id='search-input'
                        onChange={this.handleChange}
                        onKeyDown={this.handleKeyDown}
                        onKeyUp={this.handleKeyUp}
                        value={this.state.search} />
                    <Button icon='search' minimal={true} onClick={this.onSearch} />
                    { this.renderHistory() }
                    <Button icon='cross' minimal={true} onClick={this.onClear} />
                </Navbar.Group>

                <Navbar.Group align={Alignment.RIGHT}>
                { this.renderBookmarks() }
                    <Popover content={this.renderMenu()} position={Position.BOTTOM_RIGHT}>
                        <Button icon='menu' minimal={true} onClick={this.back} />
                    </Popover>
                </Navbar.Group>
            </Navbar>
        );
    }
}

function mapStateToProps(state: { myReducer:IState }, ownProps): IHeaderProps {
    return {
        searchHistory: state.myReducer.searchHistory,
        bookmarks: state.myReducer.bookmarks
    }
}

function mapDispatchToProps(dispatch): IHeaderProps {
    return {
        loadVideoDetails: videoId => dispatch(myActions.loadVideoDetails(videoId)),
        doSearch: value => dispatch(myActions.search(value))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);