import { Meteor } from 'meteor/meteor'
import { Articles } from '../collections'
import faker from 'faker'

const createSelector = ({ title = '' } = {}) => {
  if (title.toLowerCase().includes('Hello')) {
    return {
      title: title
    }
  }
  return {}
}

Meteor.publish('articles', (params) => {
  console.log('Called articles publication with params', params)

  const selector = createSelector(params)

  return Articles.find(selector)
})

Meteor.startup(() => {
  Articles.remove({})
  Meteor.setTimeout(() => {
    if (!Articles.findOne()) {
      const docs = Array.from(Array(20).keys())

      docs.forEach(doc => (
        Articles.insert({
          title: faker.lorem.sentence(),
          createdAt: new Date()
        })
      ))

    }
  }, 1000)
})
