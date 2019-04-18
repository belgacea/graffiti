import * as React from "react"
import * as _ from 'lodash'

import { DuplicateGroup, SelectableVideo } from "../types/MaintenanceTypes";
import SelectableVideoItem from './SelectableVideoItem'

interface IDuplicateGroupItemProps {
    duplicateGroup: DuplicateGroup
    onItemSelected: (duplicateGroup: DuplicateGroup, duplicateVideo: SelectableVideo, isSelected: boolean) => void
}

interface IDuplicateGroupItemState {
}

export default class DuplicateGroupItem extends React.Component<IDuplicateGroupItemProps, IDuplicateGroupItemState> {
    constructor(props) {
        super(props);
    }

    onItemSelected = (duplicateVideo: SelectableVideo, isSelected: boolean) => {
        // d.path = '_selected_' + d.path;
        // d.isSelected = isSelected;
        // this.setState({videos: [...this.props.videos]})
        this.props.onItemSelected(this.props.duplicateGroup, duplicateVideo, isSelected);
    }

    render() {
        const { duplicateGroup } = this.props;
        
        let items = [];
        _.each(duplicateGroup.videos, (duplicateVideo: SelectableVideo, key: any) => {
            items.push(
                <SelectableVideoItem key={key + '|' + duplicateVideo._id} selectableVideo={duplicateVideo} onSelected={this.onItemSelected} />
            );
        });

        return (
            <div>
                <h5>{items.length} videos</h5>
                {items}
            </div>
        );
    }
}
