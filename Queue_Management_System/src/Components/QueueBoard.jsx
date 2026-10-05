import { formatQueueNumber } from '../utils/queue'
import '../Styles/QueueBoard.css'

function QueueBoard({ orders }) {
  const groups = [
    { status: 'ready', title: 'Ready for pickup', subtitle: 'Your meal is waiting for you.', empty: 'No orders ready for pickup yet.' },
    { status: 'preparing', title: 'In the kitchen', subtitle: 'Freshly prepared, on the way.', empty: 'No orders being prepared.' },
    { status: 'pending', title: 'Coming up next', subtitle: 'Orders waiting to be prepared.', empty: 'No orders waiting.' },
  ]

  return (
    <section className="board-card" aria-labelledby="board-title">
      <div className="card-heading"><h2 id="board-title">At the counter</h2><span className="board-caption">Today’s queue</span></div>
      {groups.map((group) => {
        const matching = orders.filter((order) => order.status === group.status)
        return <div className={`board-group group-${group.status}`} key={group.status}><div className="group-heading"><h3><span className={`status-dot dot-${group.status}`} />{group.title}</h3><span className="group-count">{matching.length}</span></div><p>{group.subtitle}</p><div className="queue-chips">{matching.length ? matching.map((order) => <span className="queue-chip" key={order.id}>{formatQueueNumber(order.queueNumber)}</span>) : <span className="board-empty">{group.empty}</span>}</div></div>
      })}
      <p className="board-footnote">Orders may be ready at different times depending on what you ordered.</p>
    </section>
  )
}

export default QueueBoard
