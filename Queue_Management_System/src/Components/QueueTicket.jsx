import { formatQueueNumber, statusLabels, statuses } from '../utils/queue'
import '../Styles/QueueTicket.css'

function QueueTicket({ order, orders }) {
  const step = statuses.indexOf(order.status)
  const ahead = orders.filter((item) => item.queueNumber < order.queueNumber && ['pending', 'preparing'].includes(item.status)).length
  const messages = {
    pending: 'You’re in the queue. Sit back while we get to your order.',
    preparing: 'Your order is being prepared. It’ll be ready for pickup soon.',
    ready: 'Your order is ready! Please proceed to the pickup counter.',
    picked_up: 'Your order has been picked up. Enjoy your meal!',
  }

  return (
    <section className="ticket-card" aria-labelledby="ticket-title" aria-live="polite">
      <div className="card-heading"><h2 id="ticket-title">Your order</h2><span className={`status-badge badge-${order.status}`}>{statusLabels[order.status]}</span></div>
      <div className="ticket-number"><p>YOUR QUEUE NUMBER</p><strong>{formatQueueNumber(order.queueNumber)}</strong><span>{messages[order.status]}</span></div>
      <ol className="order-progress" aria-label="Order progress">
        {statuses.map((status, index) => <li className={index <= step ? 'step-active' : ''} key={status} aria-current={index === step ? 'step' : undefined}><span className="step-circle" aria-hidden="true">{index < step ? '✓' : index + 1}</span><span>{statusLabels[status]}</span></li>)}
      </ol>
      {['pending', 'preparing'].includes(order.status) && <p className="orders-ahead"><strong>{ahead}</strong> {ahead === 1 ? 'order' : 'orders'} ahead of yours still being prepared or waiting</p>}
      <div className="ticket-details"><div><span>Order details</span><strong>{order.items}</strong></div><div><span>Placed at</span><strong>{order.time}</strong></div><div><span>Pickup location</span><strong>Campus cafeteria counter</strong></div></div>
    </section>
  )
}

export default QueueTicket
