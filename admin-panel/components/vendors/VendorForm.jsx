'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectItem } from '@/components/ui/select';

const vendorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(9, 'Invalid phone number'),
  address: z.string().min(5, 'Address is required'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  working_hours_start: z.string().optional(),
  working_hours_end: z.string().optional(),
});

/**
 * @param {Object} props
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} props.defaultValues - Default values for form
 * @param {boolean} props.loading - Loading state
 */
export default function VendorForm({ onSubmit, defaultValues, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(vendorSchema),
    defaultValues: defaultValues || {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Vendor Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Pizza House"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+998901234567"
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="Street, City"
          />
          {errors.address && (
            <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            {...register('latitude')}
            placeholder="41.2995"
            type="number"
            step="any"
          />
        </div>

        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            {...register('longitude')}
            placeholder="69.2401"
            type="number"
            step="any"
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" {...register('category')}>
            <SelectItem value="">Select Category</SelectItem>
            <SelectItem value="restaurant">Restaurant</SelectItem>
            <SelectItem value="cafe">Cafe</SelectItem>
            <SelectItem value="fast_food">Fast Food</SelectItem>
            <SelectItem value="grocery">Grocery</SelectItem>
            <SelectItem value="pharmacy">Pharmacy</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Brief description of the vendor"
          />
        </div>

        <div>
          <Label htmlFor="working_hours_start">Opening Time</Label>
          <Input
            id="working_hours_start"
            type="time"
            {...register('working_hours_start')}
          />
        </div>

        <div>
          <Label htmlFor="working_hours_end">Closing Time</Label>
          <Input
            id="working_hours_end"
            type="time"
            {...register('working_hours_end')}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Vendor'}
        </Button>
      </div>
    </form>
  );
}
