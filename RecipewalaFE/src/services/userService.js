import api from './api'

export const userService = {
  async updateProfile(formData) {
    return await api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  async deleteAccount(password) {
    return await api.delete('/users/account', { data: { password } })
  },
  async getProfile() {
    return await api.get('/users/profile')
  }
}
