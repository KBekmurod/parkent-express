'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    delivery_fee: '',
    delivery_radius: '',
    min_order_amount: '',
    system_name: '',
    support_phone: '',
    notification_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/settings');
      setSettings(response.data || settings);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await api.put('/api/settings', settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Configure system settings</p>
      </div>

      {error && <ErrorMessage message={error} />}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">Settings saved successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="system_name">System Name</Label>
              <Input
                id="system_name"
                name="system_name"
                value={settings.system_name}
                onChange={handleChange}
                placeholder="Parkent Express"
              />
            </div>

            <div>
              <Label htmlFor="support_phone">Support Phone</Label>
              <Input
                id="support_phone"
                name="support_phone"
                value={settings.support_phone}
                onChange={handleChange}
                placeholder="+998901234567"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="delivery_fee">Delivery Fee (UZS)</Label>
              <Input
                id="delivery_fee"
                name="delivery_fee"
                type="number"
                value={settings.delivery_fee}
                onChange={handleChange}
                placeholder="5000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Default delivery fee in UZS
              </p>
            </div>

            <div>
              <Label htmlFor="delivery_radius">Delivery Radius (km)</Label>
              <Input
                id="delivery_radius"
                name="delivery_radius"
                type="number"
                step="0.1"
                value={settings.delivery_radius}
                onChange={handleChange}
                placeholder="10"
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum delivery distance from vendor
              </p>
            </div>

            <div>
              <Label htmlFor="min_order_amount">Minimum Order Amount (UZS)</Label>
              <Input
                id="min_order_amount"
                name="min_order_amount"
                type="number"
                value={settings.min_order_amount}
                onChange={handleChange}
                placeholder="10000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum order amount required
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notification_enabled"
                name="notification_enabled"
                checked={settings.notification_enabled}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="notification_enabled" className="cursor-pointer">
                Enable push notifications
              </Label>
            </div>
            <p className="text-sm text-gray-500">
              Send notifications to users about order updates
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
