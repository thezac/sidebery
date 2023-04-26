import * as Utils from 'src/utils'
import { Panel, ReactiveTab, Tab, TabsPanel } from 'src/types'
import { Tabs } from 'src/services/tabs.fg'
import { Selection } from 'src/services/selection'
import { Search } from 'src/services/search'
import { Sidebar } from 'src/services/sidebar'

let prevActivePanelId: ID | undefined
export function onTabsSearch(activePanel: Panel): void {
  if (!Utils.isTabsPanel(activePanel)) return

  const value = Search.reactive.value
  const samePanel = prevActivePanelId === activePanel.id
  prevActivePanelId = activePanel.id

  if (activePanel.tabs.length) {
    // Filter tabs
    if (value) {
      const prevValue = Search.prevValue
      const moreSpecific = value.length > prevValue.length

      let tabs: Tab[] | undefined
      if (prevValue && moreSpecific && value.startsWith(prevValue) && samePanel) {
        tabs = activePanel.filteredTabs
      }
      if (!tabs) tabs = activePanel.tabs

      const filtered: Tab[] = []
      const rFiltered: ReactiveTab[] = []
      const filteredInvisible: Tab[] = []
      const rFilteredInvisible: ReactiveTab[] = []
      for (const tab of tabs) {
        if (Search.check(tab.title) || Search.check(tab.url)) {
          const rTab = Tabs.reactive.byId[tab.id]
          if (!rTab) continue
          if (!tab.invisible) {
            filtered.push(tab)
            rFiltered.push(rTab)
          } else {
            filteredInvisible.push(tab)
            rFilteredInvisible.push(rTab)
          }
        }
      }
      activePanel.filteredTabs = filtered.concat(filteredInvisible)
      activePanel.reactive.filteredTabs = rFiltered.concat(rFilteredInvisible)
      activePanel.reactive.filteredLen = activePanel.filteredTabs.length
    } else {
      activePanel.filteredTabs = undefined
      activePanel.reactive.filteredTabs = undefined
      activePanel.reactive.filteredLen = undefined
    }

    // Search start
    if (value) {
      const firstTab = activePanel.filteredTabs?.[0]
      if (firstTab) {
        Selection.resetSelection()
        Selection.selectTab(firstTab.id)
        Tabs.scrollToTab(firstTab.id)
      }
    }

    // Search end
    if (Search.prevValue && !value) {
      Selection.resetSelection()
    }
  } else {
    if (value) findInAnotherPanel()
    else Search.reset(activePanel)
  }
}

export function onTabsSearchNext(panel?: Panel): void {
  if (!panel) panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(panel) || !panel.filteredTabs) return

  const selId = Selection.getFirst()
  let index = panel.filteredTabs.findIndex(t => t.id === selId)

  index += 1
  if (index < 0 || index >= panel.filteredTabs.length) return

  Selection.resetSelection()
  const tab = panel.filteredTabs[index]
  if (tab) {
    Selection.selectTab(tab.id)
    Tabs.scrollToTab(tab.id)
  }
}

export function onTabsSearchPrev(panel?: Panel): void {
  if (!panel) panel = Sidebar.panelsById[Sidebar.reactive.activePanelId]
  if (!Utils.isTabsPanel(panel) || !panel.filteredTabs) return

  const selId = Selection.getFirst()
  let index = panel.filteredTabs.findIndex(t => t.id === selId)

  index -= 1
  if (index < 0 || index >= panel.filteredTabs.length) return

  Selection.resetSelection()
  const tab = panel.filteredTabs[index]
  if (tab) {
    Selection.selectTab(tab.id)
    Tabs.scrollToTab(tab.id)
  }
}

export function onTabsSearchEnter(panel?: Panel): void {
  if (!Utils.isTabsPanel(panel)) return

  // Try to find in another panel
  if (Search.reactive.value && !panel.filteredTabs?.length) return findInAnotherPanel()

  const selId = Selection.getFirst()
  const tab = Tabs.reactive.byId[selId]
  if (tab) browser.tabs.update(tab.id, { active: true })

  Search.stop()
}

export function onTabsSearchSelectAll(panel: TabsPanel): void {
  if (!panel.filteredTabs) return

  const ids: ID[] = []
  let allSelected = true
  for (const tab of panel.filteredTabs) {
    if (allSelected && !tab.sel) allSelected = false
    ids.push(tab.id)
  }

  Selection.resetSelection()
  if (!allSelected && ids.length) Selection.selectTabs(ids)
}

function findInAnotherPanel(): void {
  const firstMatch = Tabs.list.find(t => {
    return !t.pinned && (Search.check(t.title) || Search.check(t.url))
  })
  if (!firstMatch) return

  const panel = Sidebar.panelsById[firstMatch.panelId]
  if (!Utils.isTabsPanel(panel)) return

  // panel.filteredTabs = panel.tabs.filter(t => Search.check(t.title) || Search.check(t.url))
  // panel.filteredLen = panel.filteredTabs.length

  panel.filteredTabs = undefined
  panel.reactive.filteredTabs = undefined
  panel.reactive.filteredLen = undefined

  Sidebar.activatePanel(firstMatch.panelId)
}
