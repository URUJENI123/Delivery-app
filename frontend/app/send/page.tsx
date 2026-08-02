'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Phone, Hash, Tag, Package as PackageIcon, FileText, AlertTriangle, DollarSign, Clock, Shield, StickyNote, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepProgress } from '@/components/delivery/StepProgress';
import { GroupedFormSection, FormRow } from '@/components/ui/GroupedFormSection';
import { Toggle } from '@/components/ui/Toggle';
import { MapPicker } from '@/components/map/MapPicker';
import { api } from '@/lib/api';

const steps = [
  { label: 'Pickup' },
  { label: 'Drop-off' },
  { label: 'Details' },
  { label: 'Confirm' },
];

const categories = ['Document', 'Food', 'Electronics', 'Clothing', 'Pharmacy', 'Other'];
const sizes = ['S', 'M', 'L'];

export default function SendPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [focused, setFocused] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [pickupContact, setPickupContact] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupEmail, setPickupEmail] = useState('');
  const [pickupDetails, setPickupDetails] = useState('');
  const [showPickupMap, setShowPickupMap] = useState(false);

  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [dropoffContact, setDropoffContact] = useState('');
  const [dropoffPhone, setDropoffPhone] = useState('');
  const [dropoffEmail, setDropoffEmail] = useState('');
  const [dropoffDetails, setDropoffDetails] = useState('');
  const [showDropoffMap, setShowDropoffMap] = useState(false);

  const [category, setCategory] = useState('');
  const [size, setSize] = useState('S');
  const [description, setDescription] = useState('');
  const [fragile, setFragile] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [pickupTime, setPickupTime] = useState('ASAP');
  const [requireOTP, setRequireOTP] = useState(true);
  const [instructions, setInstructions] = useState('');

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!pickupLocation && !!pickupLat && !!pickupLng && !!pickupContact && !!pickupPhone && !!pickupDetails;
      case 1: return !!dropoffLocation && !!dropoffLat && !!dropoffLng && !!dropoffContact && !!dropoffPhone && !!dropoffDetails;
      case 2: return !!category && !!description;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const delivery = await api.post<{ id: string }>('/deliveries', {
        pickupAddress: pickupLocation,
        pickupLat,
        pickupLng,
        pickupNotes: pickupDetails,
        pickupEmail: pickupEmail || undefined,
        pickupContactName: pickupContact,
        pickupContactPhone: pickupPhone,
        dropoffAddress: dropoffLocation,
        dropoffLat,
        dropoffLng,
        dropoffNotes: dropoffDetails,
        dropoffEmail: dropoffEmail || undefined,
        recipientName: dropoffContact,
        recipientPhone: dropoffPhone,
        itemDescription: description,
        category: category.toUpperCase(),
        size: ({ S: 'SMALL', M: 'MEDIUM', L: 'LARGE' } as Record<string, string>)[size],
        isFragile: fragile,
        estimatedValueRwf: estimatedValue ? Number(estimatedValue) : undefined,
        requiresRecipientOtp: requireOTP,
        preferAsap: pickupTime === 'ASAP',
      });
      router.push(`/deliveries/${delivery.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create delivery');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <StepProgress steps={steps} currentStep={currentStep} />

      {showPickupMap && (
        <MapPicker
          initialCoords={pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : null}
          onConfirm={({ lat, lng, address }) => {
            setPickupLat(lat);
            setPickupLng(lng);
            setPickupLocation(address);
            setShowPickupMap(false);
          }}
          onClose={() => setShowPickupMap(false)}
        />
      )}

      {showDropoffMap && (
        <MapPicker
          initialCoords={dropoffLat && dropoffLng ? { lat: dropoffLat, lng: dropoffLng } : null}
          onConfirm={({ lat, lng, address }) => {
            setDropoffLat(lat);
            setDropoffLng(lng);
            setDropoffLocation(address);
            setShowDropoffMap(false);
          }}
          onClose={() => setShowDropoffMap(false)}
        />
      )}

      <div className="p-4 max-w-lg mx-auto">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            className="flex items-center gap-1 text-gray-500 font-body text-sm font-medium mb-4 h-11 hover:text-gray-950 transition-colors"
          >
            <ChevronLeft size={18} />
            Back
          </button>
        )}

        {currentStep === 0 && (
          <div>
            <h2 className="font-display text-xl font-bold text-gray-950 mb-1">Pickup location</h2>
            <p className="font-body text-sm text-gray-500 mb-5">Where should the courier pick up the package?</p>

            <GroupedFormSection title="PICKUP">
              <FormRow
                icon={<MapPin className="w-5 h-5 text-success" />}
                label="Location"
                value={pickupLocation || 'Tap to set on map'}
                chevron
                focused={focused === 'pickupLocation'}
                onClick={() => setShowPickupMap(true)}
              />
              {pickupLat && pickupLng && (
                <FormRow
                  icon={<MapPin className="w-5 h-5 text-gray-400" />}
                  label="Coordinates"
                  value={`${pickupLat.toFixed(5)}, ${pickupLng.toFixed(5)}`}
                />
              )}
              <FormRow
                icon={<Phone className="w-5 h-5" />}
                label="Contact name"
                value={
                  <input
                    type="text"
                    value={pickupContact}
                    onChange={(e) => setPickupContact(e.target.value)}
                    placeholder="Full name"
                    className="w-full text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400"
                    onFocus={() => setFocused('pickupContact')}
                    onBlur={() => setFocused(null)}
                  />
                }
                focused={focused === 'pickupContact'}
              />
              <FormRow
                icon={<Hash className="w-5 h-5" />}
                label="Phone number"
                value={
                  <input
                    type="tel"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    className="w-full text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400"
                    onFocus={() => setFocused('pickupPhone')}
                    onBlur={() => setFocused(null)}
                  />
                }
                focused={focused === 'pickupPhone'}
              />
              <FormRow
                icon={<Mail className="w-5 h-5" />}
                label="Email"
                value={
                  <input
                    type="email"
                    value={pickupEmail}
                    onChange={(e) => setPickupEmail(e.target.value)}
                    placeholder="Optional"
                    className="w-full text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400"
                    onFocus={() => setFocused('pickupEmail')}
                    onBlur={() => setFocused(null)}
                  />
                }
                focused={focused === 'pickupEmail'}
              />
            </GroupedFormSection>

            <GroupedFormSection title="LOCATION DETAILS">
              <FormRow
                icon={<StickyNote className="w-5 h-5" />}
                label="Directions for courier"
                value={
                  <textarea
                    value={pickupDetails}
                    onChange={(e) => setPickupDetails(e.target.value)}
                    placeholder="Describe how to find this place ΓÇö landmarks, building name, floor, gate color, etc."
                    rows={3}
                    className="w-full text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400 resize-none"
                    onFocus={() => setFocused('pickupDetails')}
                    onBlur={() => setFocused(null)}
                  />
                }
                focused={focused === 'pickupDetails'}
                className="!h-auto min-h-[72px]"
              />
            </GroupedFormSection>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <h2 className="font-display text-xl font-bold text-gray-950 mb-1">Drop-off location</h2>
            <p className="font-body text-sm text-gray-500 mb-5">Where should the package be delivered?</p>

            <GroupedFormSection title="DROP-OFF">
              <FormRow
                icon={<MapPin className="w-5 h-5 text-red-600" />}
                label="Location"
                value={dropoffLocation || 'Tap to set on map'}
                chevron
                focused={focused === 'dropoffLocation'}
                onClick={() => setShowDropoffMap(true)}
              />
              {dropoffLat && dropoffLng && (
                <FormRow
                  icon={<MapPin className="w-5 h-5 text-gray-400" />}
                  label="Coordinates"
                  value={`${dropoffLat.toFixed(5)}, ${dropoffLng.toFixed(5)}`}
                />
              )}
              <FormRow
                icon={<Phone className="w-5 h-5" />}
                label="Contact name"
                value={
                  <input
                    type="text"
                    value={dropoffContact}
                    onChange={(e) => setDropoffContact(e.target.value)}
                    placeholder="Full name"
                    className="w-full text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400"
                    onFocus={() => setFocused('dropoffContact')}
                    onBlur={() => setFocused(null)}
                  />
                }
                focused={focused === 'dropoffContact'}
              />
              <FormRow
                icon={<Hash className="w-5 h-5" />}
                label="Phone number"
                value={
                  <input
                    type="tel"
                    value={dropoffPhone}
                    onChange={(e) => setDropoffPhone(e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    className="w-full text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400"
                    onFocus={() => setFocused('dropoffPhone')}
                    onBlur={() => setFocused(null)}
                  />
                }
                focused={focused === 'dropoffPhone'}
              />
              <FormRow
                icon={<Mail className="w-5 h-5" />}
                label="Email"
                value={
                  <input
                    type="email"
                    value={dropoffEmail}
                    onChange={(e) => setDropoffEmail(e.target.value)}
                    placeholder="Optional"
                    className="w-full text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400"
                    onFocus={() => setFocused('dropoffEmail')}
                    onBlur={() => setFocused(null)}
                  />
                }
                focused={focused === 'dropoffEmail'}
              />
            </GroupedFormSection>

            <GroupedFormSection title="LOCATION DETAILS">
              <FormRow
                icon={<StickyNote className="w-5 h-5" />}
                label="Directions for courier"
                value={
                  <textarea
                    value={dropoffDetails}
                    onChange={(e) => setDropoffDetails(e.target.value)}
                    placeholder="Describe how to find this place ΓÇö landmarks, building name, floor, gate color, etc."
                    rows={3}
                    className="w-full text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400 resize-none"
                    onFocus={() => setFocused('dropoffDetails')}
                    onBlur={() => setFocused(null)}
                  />
                }
                focused={focused === 'dropoffDetails'}
                className="!h-auto min-h-[72px]"
              />
            </GroupedFormSection>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="font-display text-xl font-bold text-gray-950 mb-1">Package details</h2>
            <p className="font-body text-sm text-gray-500 mb-5">Tell us about your package</p>

            <GroupedFormSection title="PACKAGE DETAILS">
              <FormRow
                icon={<Tag className="w-5 h-5" />}
                label="Category"
                value={
                  <div className="flex items-center gap-2">
                    <span className={category ? 'font-body text-sm text-gray-950' : 'font-body text-sm text-gray-400'}>
                      {category || 'Select'}
                    </span>
                    <div className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-none">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCategory(c)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors shrink-0 ${
                            category === c ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                }
              />
              <FormRow
                icon={<PackageIcon className="w-5 h-5" />}
                label="Size"
                value={
                  <div className="flex gap-1.5">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`w-10 h-9 rounded-md text-xs font-semibold font-display transition-colors ${
                          size === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                }
              />
              <FormRow
                icon={<FileText className="w-5 h-5" />}
                label="Description"
                value={
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What&apos;s in the package?"
                    className="w-full text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400"
                    onFocus={() => setFocused('description')}
                    onBlur={() => setFocused(null)}
                  />
                }
                focused={focused === 'description'}
              />
              <FormRow
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Fragile?"
                value={<Toggle checked={fragile} onChange={setFragile} />}
              />
              <FormRow
                icon={<DollarSign className="w-5 h-5" />}
                label="Est. value"
                value={
                  <div className="flex items-center gap-1">
                    <span className="font-body text-xs text-gray-400">RWF</span>
                    <input
                      type="number"
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(e.target.value)}
                      placeholder="Optional"
                      className="w-20 text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400"
                    />
                  </div>
                }
              />
            </GroupedFormSection>

            <GroupedFormSection title="DELIVERY PREFERENCES">
              <FormRow
                icon={<Clock className="w-5 h-5" />}
                label="Pickup time"
                value={
                  <span className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-600 font-display text-xs font-semibold rounded-full">
                    {pickupTime}
                  </span>
                }
              />
              <FormRow
                icon={<Shield className="w-5 h-5" />}
                label="Require delivery OTP"
                value={<Toggle checked={requireOTP} onChange={setRequireOTP} />}
              />
              <FormRow
                icon={<StickyNote className="w-5 h-5" />}
                label="Instructions"
                value={
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Optional notes"
                    className="w-24 text-right bg-transparent outline-none font-body text-sm text-gray-950 placeholder:text-gray-400"
                  />
                }
              />
            </GroupedFormSection>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="font-display text-xl font-bold text-gray-950 mb-1">Confirm delivery</h2>
            <p className="font-body text-sm text-gray-500 mb-5">Review your delivery request</p>

            <GroupedFormSection title="ROUTE">
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex flex-col items-center gap-0.5 mt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
                  <div className="w-[2px] h-4 border-l-2 border-dashed border-gray-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-body text-sm text-gray-950">From: {pickupLocation}</p>
                    {pickupDetails && (
                      <p className="font-body text-xs text-gray-500 mt-0.5">{pickupDetails}</p>
                    )}
                  </div>
                  <div>
                    <p className="font-body text-sm text-gray-950">To: {dropoffLocation}</p>
                    {dropoffDetails && (
                      <p className="font-body text-xs text-gray-500 mt-0.5">{dropoffDetails}</p>
                    )}
                  </div>
                </div>
              </div>
            </GroupedFormSection>

            <GroupedFormSection title="PACKAGE">
              <FormRow icon={<Tag className="w-4 h-4" />} label="Category" value={category} />
              <FormRow icon={<PackageIcon className="w-4 h-4" />} label="Size" value={size} />
              <FormRow icon={<FileText className="w-4 h-4" />} label="Description" value={description} />
              {fragile && <FormRow icon={<AlertTriangle className="w-4 h-4" />} label="Fragile" value="Yes" />}
            </GroupedFormSection>

            <GroupedFormSection title="CONTACT">
              <FormRow icon={<Phone className="w-4 h-4" />} label="Pickup contact" value={`${pickupContact} ┬╖ ${pickupPhone}`} />
              <FormRow icon={<Phone className="w-4 h-4" />} label="Recipient contact" value={`${dropoffContact} ┬╖ ${dropoffPhone}`} />
            </GroupedFormSection>

            <Button fullWidth size="lg" className="!h-14" onClick={handleSubmit} loading={submitting}>
              Find a Courier
            </Button>
          </div>
        )}

        {currentStep < 3 && (
          <div className="mt-6">
            <Button
              fullWidth
              size="lg"
              disabled={!canProceed()}
              onClick={() => setCurrentStep(s => s + 1)}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
