import { GroupedTabInfo, GroupPin } from 'src/types'

export interface MsgUpdated {
  name: 'update'
  index?: number
  len?: number
  parentId?: ID
  title?: string
  tabs?: GroupedTabInfo[]
  pin?: GroupPin
}

export type MsgTabCreated = {
  name: 'create'
} & GroupedTabInfo

export type MsgTabUpdated = {
  name: 'updateTab'
} & GroupedTabInfo

export type MsgTabRemoved = {
  name: 'remove'
} & GroupedTabInfo

export type Msg = MsgUpdated | MsgTabCreated | MsgTabUpdated | MsgTabRemoved
