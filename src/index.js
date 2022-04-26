const express = require('express')
const { v4 } = require('uuid')

const app = express()

let customers = []
app.use(express.json())

function checkIfAccountExists(request, response, next) {
  const { cpf } = request.headers
  const accountResult = customers.find(customer => customer.cpf === cpf)
  if (!accountResult)
    return response.status(400).json({ error: 'Could not find the account' })

  request.customer = accountResult
  next()
}
app.post('/account', (request, response) => {
  const { cpf, name } = request.body
  const cpfAlreadyRegistered = customers.some(customer => customer.cpf === cpf)
  if (cpfAlreadyRegistered)
    return response.status(400).json({ error: 'Cpf Already registered' })
  const statement = []
  const id = v4()
  customers.push({ cpf, name, id, statement })
  return response.status(201).json({ id, cpf, name, statement })
})

app.use(checkIfAccountExists)
app.get('/statement', (request, response) => {
  const { customer } = request
  let balance = 0
  customer.statement.forEach(operation => {
    if (operation.type === 'deposit')
      balance += operation.amount
    else
      balance -= operation.amount
  })
  return response.json({ statement: customer.statement, balance })
})

app.post('/deposit', (request, response) => {
  const { amount, description } = request.body
  const newStatement = { amount, description, type: 'deposit', created_at: new Date() }
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].cpf === request.customer.cpf) {
      customers[i].statement.push(newStatement)
    }
  }
  return response.json({ newStatement })
})

app.post('/withdraw', (request, response) => {
  const { amount, description } = request.body
  const { customer } = request
  let balance = 0
  customer.statement.forEach(operation => {
    if (operation.type === 'deposit')
      balance += operation.amount
    else
      balance -= operation.amount
  })
  if (balance < amount)
    return response.status(400).json({ error: 'Not enough money on the account' })
  const newStatement = { amount, description, type: 'withdraw', created_at: new Date() }
  for (let i = 0; i < customers.length; i++) {
    if (customers[i].cpf === request.customer.cpf) {
      customers[i].statement.push(newStatement)
    }
  }
  return response.json({ newStatement })
})

app.delete('/account', (request, response) => {
  const { customer } = request
  customers = customers.filter(oldCustomer => oldCustomer.cpf !== customer.cpf)
  return response.json(customer)
})

app.get('/account', (request, response) => {
  return response.json(request.customer)
})
app.listen(3333, () => console.log('Server open on port 3333'))
