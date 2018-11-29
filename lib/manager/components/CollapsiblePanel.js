// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, type Element} from 'react'
import {
  Button,
  ButtonToolbar,
  Col,
  Panel,
  Form,
  FormGroup,
  ControlLabel,
  FormControl
} from 'react-bootstrap'

import {getComponentMessages} from '../../common/util/config'
import type {FormProps} from '../../types'

type Props = {
  children?: Element<*>,
  data: any,
  defaultExpanded: boolean,
  fields: Array<FormProps>,
  index: number,
  onChange: (SyntheticInputEvent<HTMLInputElement>, number) => void,
  onRemove?: number => void,
  onSave?: number => any,
  title: Element<*> | string
}

export default class CollapsiblePanel extends Component<Props> {
  messages = getComponentMessages('CollapsiblePanel')

  _onChange = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.onChange(evt, this.props.index)

  _onRemove = () => this.props.onRemove && this.props.onRemove(this.props.index)

  _onSave = () => this.props.onSave && this.props.onSave(this.props.index)

  render () {
    const {fields, data, defaultExpanded, title} = this.props
    return (
      <Panel
        header={<h5 style={{width: '100%', cursor: 'pointer'}}>{title}</h5>}
        defaultExpanded={defaultExpanded}
        collapsible>
        <Form>
          <ButtonToolbar className='pull-right'>
            {/* Only render save button is onSave prop is defined */}
            {typeof this.props.onSave === 'function' &&
              <Button
                bsSize='xsmall'
                bsStyle='primary'
                onClick={this._onSave}>
                <Icon type='floppy-o' />
              </Button>
            }
            <Button
              bsSize='xsmall'
              bsStyle='danger'
              onClick={this._onRemove}>
              <Icon type='trash-o' />
            </Button>
          </ButtonToolbar>
          {fields.map((f, i) => {
            const {split, ...fieldProps} = f
            const fieldName = f.name.split('.').slice(-1)[0]
            const value = data[fieldName]
            const isCheckbox = f.type === 'checkbox'
            const checkboxProps = isCheckbox ? {checked: value} : {}
            return (
              <Col key={i} xs={f.width || 6}>
                <FormGroup>
                  <ControlLabel>{this.messages(`deployment.${f.name}`)}</ControlLabel>
                  <FormControl
                    value={value === null ? '' : value}
                    {...checkboxProps} // adds checkbox props if type is checkbox
                    {...fieldProps}
                    placeholder={isCheckbox
                      ? undefined
                      : f.placeholder || this.messages(`deployment.${f.name}Placeholder`)
                    }
                    name={f.name}
                    children={f.children
                      ? f.children.sort((a, b) => {
                        if (a.value < b.value) return -1
                        if (a.value > b.value) return 1
                        return 0
                      }).map((o, i) => (
                        <option key={i} {...o} />
                      ))
                      : undefined
                    }
                    onChange={this._onChange} />
                </FormGroup>
              </Col>
            )
          })}
          {/* Additional (usually more complex) fields can go here. */}
          {this.props.children}
        </Form>
      </Panel>
    )
  }
}
