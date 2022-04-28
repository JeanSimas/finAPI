const express = require('express')
const { v4 } = require('uuid')

const app = express()

const customers = []
app.use(express.json())

function checkIfAccountExists(request, response, next) {
  const { cpf } = request.headers
  const accountResult = customers.find(customer => customer.cpf === cpf)
  if (!accountResult)
    return response.status(400).json({ error: 'Could not find the account' })

  request.customer = accountResult
  next()
}

function getBalance(statement) {
  let balance = 0
  statement.forEach(operation => {
    if (operation.type === 'deposit')
      balance += operation.amount
    else
      balance -= operation.amount
  })

  return balance
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
  const balance = getBalance(customer.statement)

  return response.json({ statement: customer.statement, balance })
})

app.get('/statement/date', (request, response) => {
  const { customer } = request
  const { date } = request.query

  const dateFormat = new Date(date + '00:00')
  const statement = customer.statement.filter(statement => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

  return response.json(statement)
})
app.post('/deposit', (request, response) => {
  const { amount, description } = request.body
  const { customer } = request
  if (amount <= 0)
    return response.status(400).json({ error: 'Invalid amount' })
  const newStatement = { amount, description, type: 'deposit', created_at: new Date() }

  customer.statement.push(newStatement)
  return response.json({ newStatement })
})

app.post('/withdraw', (request, response) => {
  const { amount, description } = request.body
  if (amount <= 0)
    return response.status(400).json({ error: 'Invalid amount' })
  const { customer } = request
  const balance = getBalance(customer.statement)
  if (balance < amount)
    return response.status(400).json({ error: 'Not enough money on the account' })
  const newStatement = { amount, description, type: 'withdraw', created_at: new Date() }
  customer.statement.push(newStatement)
  return response.json({ newStatement })
})

app.put('/account', (request, response) => {
  const { name } = request.body
  const { customer } = request

  customer.name = name

  return response.json(customer)
})

app.delete('/account', (request, response) => {
  const { customer } = request

  customer.splice(customer, 1)

  return response.json(customer)
})

app.get('/account', (request, response) => {
  return response.json(request.customer)
})

app.get('/balance', (request, response) => {
  const { customer } = request

  return response.json(getBalance({ balance: customer.statement }))
})

app.listen(3333, () => console.log('Server open on port 3333'))
