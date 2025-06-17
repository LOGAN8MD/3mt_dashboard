import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosInstance';
import { useDispatch } from 'react-redux';
import { setLoading } from '../redux/actions/loadingActions';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchOrders = async () => {
      dispatch(setLoading(true));
      try {
        const { data } = await axios.get('/api/orders');
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchOrders();
  }, [dispatch]);

  return (
    <div>
      <h1>All Orders</h1>
      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{order.user.name}</td>
                <td>{order.items.length}</td>
                <td>{order.total}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Orders;
