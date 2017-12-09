import generateMutations from '../utilities/generate-mutations'
import axios from 'axios'
import { authService } from '../../services'

const state = {
  user: {},
  scope: [],
  accessToken: '',
  refreshToken: ''
}

const mutations = generateMutations(state)

const actions = {
  //TODO: Look at moving dispatch responsibility to authService login/logout
  login ({ dispatch }, credentials) {
    return authService.login(credentials)
      .then((response) => {
        dispatch('setAuth', response.data)
      })
  },
  logout ({ dispatch }) {
    return authService.logout()
      .then((response) => {
        dispatch('clearAuth')
      })
  },
  updateTokens ({ commit }, { accessToken, refreshToken }) {
    axios.defaults.headers.common.Authorization = 'Bearer ' + accessToken

    commit('SET_ACCESS_TOKEN', accessToken)
    commit('SET_REFRESH_TOKEN', refreshToken)

    console.debug('Tokens updated')
  },
  useRefreshToken ({ state }) {
    axios.defaults.headers.common.Authorization = 'Bearer ' + state.refreshToken

    console.debug('Using refresh token')
  },
  setAuth ({ commit, dispatch }, data) {
    dispatch('updateTokens', data)
    commit('SET_SCOPE', data.scope)
    commit('SET_USER', data.user)
  },
  clearAuth ({ commit }) {
    axios.defaults.headers.common.Authorization = undefined

    commit('CLEAR_ACCESS_TOKEN')
    commit('CLEAR_REFRESH_TOKEN')
    commit('CLEAR_SCOPE')
    commit('CLEAR_USER')

    console.debug('Clearing auth')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
