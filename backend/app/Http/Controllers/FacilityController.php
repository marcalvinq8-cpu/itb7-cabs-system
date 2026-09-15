<?php

namespace App\Http\Controllers;

use App\Models\Amenity;
use App\Models\Facility;
use App\Models\MaintenanceLog;
use App\Models\Reservation;
use App\Services\NotificationService;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class FacilityController extends Controller
{
    public function index(Request $request)
    {
        $query = Facility::with(['amenities' => fn($q) => $q->where('is_available', true)]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $facilities = $query->orderBy('name')->get()->map(function ($facility) {
            $data = $facility->toArray();
            $data['amenities_count'] = $facility->amenities->count();
            return $data;
        });

        return response()->json($facilities);
    }

    public function show($id)
    {
        $facility = Facility::with('amenities')->findOrFail($id);

        $bookedSlots = Reservation::where('facility_id', $id)
            ->whereIn('status', ['pending', 'approved', 'confirmed', 'completed'])
            ->whereBetween('reservation_date', [
                now()->subMonths(3)->toDateString(),
                now()->addMonths(6)->toDateString(),
            ])
            ->select('reservation_date', 'start_time', 'end_time', 'status')
            ->orderBy('reservation_date')
            ->orderBy('start_time')
            ->get()
            ->map(fn ($s) => [
                'reservation_date' => Carbon::parse($s->reservation_date)->format('Y-m-d'),
                'start_time'       => substr($s->start_time, 0, 5),
                'end_time'         => substr($s->end_time,   0, 5),
                'status'           => $s->status,
            ]);

        return response()->json(array_merge($facility->toArray(), [
            'booked_slots' => $bookedSlots,
        ]));
    }

    public function getAvailability($id, Request $request)
    {
        $request->validate(['date' => ['required', 'date']]);

        Facility::findOrFail($id);

        $slots = Reservation::where('facility_id', $id)
            ->where('reservation_date', $request->date)
            ->whereIn('status', ['pending', 'approved', 'confirmed'])
            ->select('start_time', 'end_time', 'status')
            ->orderBy('start_time')
            ->get();

        return response()->json($slots);
    }

    // ─── Admin CRUD ───────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'description'    => ['required', 'string'],
            'location'       => ['required', 'string', 'max:255'],
            'capacity'       => ['required', 'integer', 'min:1'],
            'price_per_hour' => ['required', 'numeric', 'min:0'],
            'status'         => ['in:available,under_maintenance,unavailable,closed'],
            'requires_authorization_letter' => ['sometimes', 'boolean'],
            // Laravel's 'image' rule doesn't accept SVG in this version even though
            // it's a perfectly valid image (fileinfo correctly detects it as
            // image/svg+xml) — use an explicit mimes list instead so SVG uploads
            // aren't rejected with a misleading "must be an image" error.
            'image'         => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif,webp,svg', 'max:2048'],
        ]);

        $imagePath = null;

        try {
            if ($request->hasFile('image')) {
                $imagePath = $this->storeFacilityImage($request->file('image'));
            } elseif ($request->filled('image') && is_string($request->image) && str_starts_with($request->image, 'data:image')) {
                preg_match('/^data:image\/(\w+);base64,/', $request->image, $type);
                $ext = isset($type[1]) ? strtolower($type[1]) : 'png';
                $imageData = substr($request->image, strpos($request->image, ',') + 1);
                $decoded = base64_decode($imageData);

                if ($decoded !== false) {
                    $fileName = 'facilities/' . uniqid() . '.' . $ext;
                    Storage::disk('public')->put($fileName, $decoded);
                    $imagePath = $fileName;
                }
            }
        } catch (\Exception $e) {
            $imagePath = null;
        }

        $facility = Facility::create([
            'name'           => $validated['name'],
            'description'    => $validated['description'],
            'location'       => $validated['location'],
            'capacity'       => $validated['capacity'],
            'price_per_hour' => $validated['price_per_hour'],
            'status'         => $validated['status'] ?? 'available',
            'image_path'     => $imagePath,
            'requires_authorization_letter' => $request->boolean('requires_authorization_letter'),
        ]);

        return response()->json($facility->load('amenities'), 201);
    }

    public function update(Request $request, $id)
    {
        $facility = Facility::findOrFail($id);

        $validated = $request->validate([
            'name'           => ['sometimes', 'string', 'max:255'],
            'description'    => ['sometimes', 'string'],
            'location'       => ['sometimes', 'string', 'max:255'],
            'capacity'       => ['sometimes', 'integer', 'min:1'],
            'price_per_hour' => ['sometimes', 'numeric', 'min:0'],
            'status'         => ['sometimes', 'in:available,under_maintenance,unavailable,closed'],
            'requires_authorization_letter' => ['sometimes', 'boolean'],
            // Laravel's 'image' rule doesn't accept SVG in this version even though
            // it's a perfectly valid image (fileinfo correctly detects it as
            // image/svg+xml) — use an explicit mimes list instead so SVG uploads
            // aren't rejected with a misleading "must be an image" error.
            'image'         => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif,webp,svg', 'max:2048'],
        ]);

        try {
            if ($request->hasFile('image')) {
                if ($facility->image_path && !str_starts_with($facility->image_path, 'http')) {
                    Storage::disk('public')->delete($facility->image_path);
                }
                $facility->image_path = $this->storeFacilityImage($request->file('image'));
            } elseif ($request->filled('image') && is_string($request->image) && str_starts_with($request->image, 'data:image')) {
                if ($facility->image_path && !str_starts_with($facility->image_path, 'http')) {
                    Storage::disk('public')->delete($facility->image_path);
                }
                preg_match('/^data:image\/(\w+);base64,/', $request->image, $type);
                $ext = isset($type[1]) ? strtolower($type[1]) : 'png';
                $imageData = substr($request->image, strpos($request->image, ',') + 1);
                $decoded = base64_decode($imageData);

                if ($decoded !== false) {
                    $fileName = 'facilities/' . uniqid() . '.' . $ext;
                    Storage::disk('public')->put($fileName, $decoded);
                    $facility->image_path = $fileName;
                }
            }
        } catch (\Exception $e) {
            // Huwag ibagsak ang buong request kapag nag-error
        }

        // This form posts as multipart/form-data, so a checkbox arrives as the
        // string "true"/"false" — $request->boolean() normalizes that correctly
        // (a raw (bool) cast would treat the string "false" as truthy).
        if ($request->has('requires_authorization_letter')) {
            $validated['requires_authorization_letter'] = $request->boolean('requires_authorization_letter');
        }

        unset($validated['image']);

        $facility->fill($validated);
        $facility->save();

        return response()->json($facility->load('amenities'));
    }

    public function destroy($id)
    {
        $facility = Facility::findOrFail($id);

        if ($facility->image_path && !str_starts_with($facility->image_path, 'http')) {
            Storage::disk('public')->delete($facility->image_path);
        }

        $facility->delete();

        return response()->json(['message' => 'Facility deleted successfully.']);
    }

    private function storeFacilityImage($file): ?string
    {
        if (config('services.cloudinary.url')) {
            try {
                $result = Cloudinary::uploadApi()->upload($file->getRealPath(), [
                    'folder' => 'cabs/facilities',
                ]);

                return $result['secure_url'] ?? null;
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return $file->store('facilities', 'public') ?: null;
    }

    public function updateMaintenance(Request $request, $id)
    {
        $facility = Facility::findOrFail($id);

        $validated = $request->validate([
            'status'           => ['required', 'in:available,under_maintenance,unavailable,closed'],
            'maintenance_note' => ['nullable', 'string'],
            'maintenance_start'=> ['nullable', 'date'],
            'maintenance_end'  => ['nullable', 'date', 'after_or_equal:maintenance_start'],
        ]);

        $facility->update($validated);

        MaintenanceLog::create([
            'facility_id' => $facility->id,
            'admin_id'    => $request->user()->id,
            'note'        => $validated['maintenance_note'] ?? 'Status updated to ' . $validated['status'],
            'start_date'  => $validated['maintenance_start'] ?? now()->toDateString(),
            'end_date'    => $validated['maintenance_end'] ?? now()->toDateString(),
        ]);

        if ($validated['status'] !== 'available') {
            $affectedReservations = Reservation::where('facility_id', $facility->id)
                ->whereIn('status', ['pending', 'approved'])
                ->where('reservation_date', '>=', now()->toDateString())
                ->with('user')
                ->get();

            foreach ($affectedReservations as $reservation) {
                $formattedDate = Carbon::parse($reservation->reservation_date)->format('M d, Y');

                NotificationService::notifyUser(
                    $reservation->user,
                    'facility_maintenance',
                    'Facility Under Maintenance',
                    "The {$facility->name} has been set to {$validated['status']}. Your reservation on {$formattedDate} may be affected. Please contact us for assistance.",
                    $reservation->id
                );
            }
        }

        return response()->json($facility->fresh());
    }

    // ─── Amenity CRUD ─────────────────────────────────────────────────────────

    public function storeAmenity(Request $request)
    {
        $validated = $request->validate([
            'facility_id'  => ['required', 'exists:facilities,id'],
            'name'         => ['required', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'quantity'     => ['required', 'integer', 'min:1'],
            'is_available' => ['boolean'],
        ]);

        $amenity = Amenity::create($validated);

        return response()->json($amenity, 201);
    }

    public function updateAmenity(Request $request, $id)
    {
        $amenity = Amenity::findOrFail($id);

        $validated = $request->validate([
            'name'         => ['sometimes', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'quantity'     => ['sometimes', 'integer', 'min:1'],
            'is_available' => ['boolean'],
        ]);

        $amenity->update($validated);

        return response()->json($amenity);
    }

    public function destroyAmenity($id)
    {
        Amenity::findOrFail($id)->delete();

        return response()->json(['message' => 'Amenity deleted.']);
    }
}