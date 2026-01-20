'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import FullPageLoader from '@/components/common/FullPageLoader';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  });

  useEffect(() => {
    document.title = 'Users - Admin';
    checkAuth();
    fetchUsers();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/admin/login');
      } else {
        console.error('Failed to fetch users:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData);
      } else {
        await api.post('/admin/users', formData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save user');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant='h4'>Users</Typography>
          <Typography color='text.secondary'>Manage admin users and roles.</Typography>
        </Box>
        <Button
          variant='contained'
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'admin' });
            setShowModal(true);
          }}
        >
          Add user
        </Button>
      </Box>

      <Card>
        <CardHeader title='Users' />
        <CardContent sx={{ p: 0 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{user.name}</Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={user.role}
                      color={user.role === 'super_admin' ? 'primary' : user.role === 'admin' ? 'info' : 'default'}
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size='small' variant='text' onClick={() => openEditModal(user)}>
                        Edit
                      </Button>
                      <Button size='small' variant='text' color='error' onClick={() => handleDelete(user.id)}>
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
        }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>{editingUser ? 'Edit user' : 'Add user'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label='Name'
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label='Email'
              type='email'
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label={`Password ${editingUser ? '(leave blank to keep current)' : ''}`}
              type='password'
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />
            <FormControl>
              <InputLabel id='user-role-label'>Role</InputLabel>
              <Select
                labelId='user-role-label'
                label='Role'
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: String(e.target.value) })}
              >
                <MenuItem value='super_admin'>Super Admin</MenuItem>
                <MenuItem value='admin'>Admin</MenuItem>
                <MenuItem value='manager'>Manager</MenuItem>
              </Select>
            </FormControl>

            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => { setShowModal(false); setEditingUser(null); }}>Cancel</Button>
              <Button type='submit' variant='contained'>Save</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

