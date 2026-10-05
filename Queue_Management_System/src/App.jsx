import { useState } from 'react'
import QueueBoard from './Components/QueueBoard'
import QueueTicket from './Components/QueueTicket'
import { sampleOrders } from './utils/queue'
import './App.css'

function App() {
  const [queueInput, setQueueInput] = useState('Q-006')
  const [selectedOrder, setSelectedOrder] = useState(sampleOrders[5])
  const [error, setError] = useState('')

  function findOrder(event) {
    event.preventDefault()
    const value = queueInput.trim().toUpperCase()
    if (!/^(Q-)?\d+$/.test(value)) {
      setError('Enter a queue number, such as Q-006 or 6.')
      return
    }
    const number = Number(value.replace('Q-', ''))
    const order = sampleOrders.find((item) => item.queueNumber === number)
    if (!order) {
      setError('Queue number not found. In this preview, try Q-001 to Q-007.')
      return
    }
    setSelectedOrder(order)
    setError('')
  }

  return (
    <div className="customer-app">
      <header className="site-header">
        <a className="brand" href="/" aria-label="WMSU Campus Queue home"><span className="brand-mark" aria-hidden="true">W</span><span><strong>WMSU <span>Campus Queue</span></strong><small>Western Mindanao State University</small></span></a>
        <span className="header-label">Customers View</span>
      </header>
      <main className="page-content">
        <div className="page-heading"><div><p className="eyebrow">CAMPUS CAFETERIA</p><h1>A little less waiting.<br />A little more campus life.</h1><p className="intro">Check your place in the queue. We’ll show you when your order is ready.</p></div><span className="preview-badge"><span /> Sample queue</span></div>
        <section className="lookup-panel" aria-labelledby="lookup-title">
          <div><h2 id="lookup-title">Have a queue number?</h2><p>Enter the number on your order receipt.</p></div>
          <form onSubmit={findOrder} className="lookup-form">
            <label className="sr-only" htmlFor="queue-number">Your queue number</label>
            <input id="queue-number" value={queueInput} onChange={(event) => setQueueInput(event.target.value)} placeholder="e.g. Q-006" aria-invalid={Boolean(error)} aria-describedby={error ? 'lookup-error' : undefined} required />
            <button type="submit">Track my order <span aria-hidden="true">→</span></button>
          </form>
          {error && <p id="lookup-error" className="lookup-error" role="alert">{error}</p>}
        </section>
        <div className="queue-layout">
          <QueueTicket order={selectedOrder} orders={sampleOrders} />
          <QueueBoard orders={sampleOrders} />
        </div>
        <aside className="pickup-note"><span className="note-icon" aria-hidden="true">i</span><div><strong>Ready? Head to the pickup counter.</strong><p>Show your queue number to the cafeteria staff and collect your order.</p></div></aside>
        <p className="preview-note">Preview with sample orders. Queue updates will be available when the ordering service is connected.</p>
      </main>
      <footer className="site-footer"><span>WMSU Campus Queue</span><span>Good food. Less waiting.</span></footer>
    </div>
  )
}

export default App
