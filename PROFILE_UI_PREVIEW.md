# Profile Page - UI/UX Preview

## 🎨 What Users Will See

---

## Page Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ← Dashboard | Customers | Subscriptions | Profile ✓                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Business Profile                                                       │
│  Manage your salon details and subscription                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Profile updated successfully!                                 │   │ (Alert)
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────┐ │
│  │                                         │  │  Subscription Plan   │ │
│  │  SALON DETAILS                          │  │                      │ │
│  │                                         │  │  ✓ Active            │ │
│  │  ┌─────────────────────────────────┐   │  │                      │ │
│  │  │  [Upload Salon Image]           │   │  │  Your subscription   │ │
│  │  │  📸 No image uploaded           │   │  │  is active and       │ │
│  │  │  (or shows uploaded image)      │   │  │  billing is up to    │ │
│  │  └─────────────────────────────────┘   │  │  date.               │ │
│  │                                         │  │                      │ │
│  │  Upload Salon Image [Browse...]        │  │  [🔐 Manage Subscription] │
│  │                                         │  │                      │ │
│  │  Salon Name *                          │  └──────────────────────┘ │
│  │  [My Beautiful Salon             ]     │                          │
│  │                                         │  ┌──────────────────────┐ │
│  │  Phone Number                           │  │ INVOICE HISTORY      │ │
│  │  [(555) 123-4567                ]     │  │                      │ │
│  │                                         │  │ 📄 Dec 15, 2025      │ │
│  │  Email                                  │  │ $99.00 ✓ Paid        │ │
│  │  [owner@salon.com               ]     │  │ [Download]           │ │
│  │                                         │  │                      │ │
│  │  [💾 Save Changes]                      │  │ 📄 Nov 15, 2025      │ │
│  │                                         │  │ $99.00 ✓ Paid        │ │
│  │                                         │  │ [Download]           │ │
│  └─────────────────────────────────────────┘  │                      │ │
│                                                │ No invoices yet      │ │
│                                                └──────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Page States

### 1. Initial Load (Loading State)
```
┌──────────────────────┐
│  ⟳ Loading profile...│
│                      │
│  (Spinner animation) │
└──────────────────────┘
```

### 2. With Image Preview
```
┌─────────────────────────────────┐
│    [Image Preview Area]         │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │   [Salon Logo Image]        ││
│  │   (shows actual image)      ││
│  │                             ││
│  │              [✕]            ││  ← Click to remove
│  └─────────────────────────────┘│
│                                 │
│  Upload Salon Image [Select...] │
└─────────────────────────────────┘
```

### 3. Success Message
```
┌─────────────────────────────────┐
│ ✓ Profile updated successfully! │
│                                 │
│ (Green background, auto-closes  │
│  after 3 seconds)               │
└─────────────────────────────────┘
```

### 4. Error Message
```
┌─────────────────────────────────┐
│ ⚠ Failed to update profile      │
│                                 │
│ (Red background, stays visible) │
└─────────────────────────────────┘
```

### 5. Saving State
```
[⟳ Saving...] ← Button shows loading spinner
```

### 6. Invoice Downloading
```
[⟳ Downloading...] ← Button shows loading spinner
```

---

## Mobile View (Stacked Layout)

```
┌──────────────────────────────────┐
│                                  │
│  Business Profile                │
│  Manage your salon details       │
│                                  │
│  ┌──────────────────────────────┐│
│  │ SALON DETAILS                ││
│  │                              ││
│  │ [Upload Image Area]          ││
│  │                              ││
│  │ Name: [My Salon]             ││
│  │                              ││
│  │ Phone: [(555) 123-4567]      ││
│  │                              ││
│  │ Email: [owner@salon.com]     ││
│  │                              ││
│  │ [Save Changes]               ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │ SUBSCRIPTION PLAN            ││
│  │                              ││
│  │ ✓ Active                     ││
│  │                              ││
│  │ Your subscription is active  ││
│  │ and billing is up to date.   ││
│  │                              ││
│  │ [Manage Subscription]        ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │ INVOICE HISTORY              ││
│  │                              ││
│  │ Dec 15, 2025                 ││
│  │ $99.00 ✓ Paid                ││
│  │ [Download]                   ││
│  │                              ││
│  │ Nov 15, 2025                 ││
│  │ $99.00 ✓ Paid                ││
│  │ [Download]                   ││
│  └──────────────────────────────┘│
│                                  │
└──────────────────────────────────┘
```

---

## User Interactions

### Edit Profile
```
1. User sees form with current data
2. User modifies any field
3. User clicks "Save Changes"
4. Loading spinner shows
5. Fields are disabled during save
6. Success message appears
7. Success message auto-closes after 3 seconds
```

### Upload Image
```
1. User clicks "Upload Salon Image"
2. File picker opens
3. User selects image
4. Preview appears below button
5. Can see image before saving
6. Has option to remove/change
7. Saves with profile changes
```

### Stripe Checkout
```
1. User clicks "Pay/Subscribe Now"
2. Button shows loading spinner
3. API creates Stripe session
4. User redirected to Stripe checkout
5. User enters payment details
6. Stripe processes payment
7. User redirected back to /success
8. Can return to Profile to see invoice
```

### Download Invoice
```
1. User sees invoice in list
2. User clicks "Download" button
3. Button shows loading spinner
4. Browser downloads PDF
5. File appears as "invoice-{id}.pdf"
6. User can open in PDF reader
```

---

## Color Scheme

### Buttons
- **Primary (Save):** Blue gradient `#3b82f6 → #2563eb`
- **Stripe:** Purple gradient `#625af7 → #4f46e5`
- **Download:** White border with gray text

### Alerts
- **Success:** Green background `#d1fae5`, green text `#065f46`
- **Error:** Red background `#fee2e2`, red text `#7f1d1d`

### Badges
- **Active:** Green `#d1fae5`
- **Inactive:** Gray `#f3f4f6`
- **Paid:** Green `#d1fae5`
- **Pending:** Yellow `#fef3c7`

### Borders & Backgrounds
- **Cards:** White background, `#e5e7eb` border
- **Forms:** `#d1d5db` input borders
- **Focus:** `#3b82f6` border, light blue glow

---

## Typography

- **Page Title:** 32px, bold, dark gray
- **Section Headers:** 24px, semi-bold, dark gray
- **Form Labels:** 14px, medium weight, gray
- **Form Input:** 16px, normal weight
- **Button Text:** 15px, medium weight
- **Small Text:** 14px, normal weight

---

## Animations

### Loading Spinner
```
Continuous rotation:
  0°   → 360°
  over 1 second
  repeat infinitely
```

### Button Hover
```
On hover:
  - Translate up 2px
  - Shadow expands: 0 4px 12px rgba(color, 0.4)
```

### Alert Auto-Close
```
Appears for 3 seconds
Then fades out
(for success messages only)
```

### Form Input Focus
```
On focus:
  - Border color changes to blue
  - Box shadow: 0 0 0 3px rgba(59, 130, 246, 0.1)
```

---

## Responsive Breakpoints

| Screen | Layout | Columns |
|--------|--------|---------|
| Desktop | 2 col | Profile (2fr), Sidebar (1fr) |
| Tablet | 2 col (adjusted) | Same with smaller margins |
| Mobile | 1 col | Stacked vertically |

---

## Form Validation UI

### Valid Input
```
✓ [Salon Name                    ] ← Normal blue border
```

### Error Input
```
✗ [Salon Name                    ] ← Red border
  Error message below field
```

### Required Field
```
Salon Name * ← Red asterisk
```

---

## Invoice Table Layout

```
Desktop:
┌────────────────┬──────────┬────────┬──────────┐
│ Date           │ Amount   │ Status │ Download │
├────────────────┼──────────┼────────┼──────────┤
│ Dec 15, 2025   │ $99.00   │ Paid   │ [⬇]     │
│ Nov 15, 2025   │ $99.00   │ Paid   │ [⬇]     │
└────────────────┴──────────┴────────┴──────────┘

Mobile:
┌──────────────────────────────────┐
│ Dec 15, 2025                     │
│ $99.00 ✓ Paid         [⬇]        │
├──────────────────────────────────┤
│ Nov 15, 2025                     │
│ $99.00 ✓ Paid         [⬇]        │
└──────────────────────────────────┘
```

---

## Stripe Checkout Preview

```
User clicks "Pay/Subscribe Now"
            ↓
Redirected to Stripe checkout page:

┌─────────────────────────────────────┐
│  Stripe Checkout                    │
│                                     │
│  Salon Tracker Pro - Monthly        │
│  $99/month                          │
│                                     │
│  Card information                   │
│  [1234 1234 1234 1234]              │
│  [MM/YY] [CVC]                      │
│                                     │
│  Cardholder name                    │
│  [____________________________]     │
│                                     │
│  [Subscribe] [Cancel]               │
└─────────────────────────────────────┘
```

---

## Empty States

### No Image Uploaded
```
┌────────────────────────────┐
│    [Image Preview Area]    │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │      📸              │  │
│  │  No image uploaded   │  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  Upload Salon Image [...]  │
└────────────────────────────┘
```

### No Invoices
```
┌──────────────────────────┐
│  INVOICE HISTORY         │
│                          │
│  No invoices yet         │
│                          │
│  Complete a payment to   │
│  see your invoices here. │
└──────────────────────────┘
```

### Loading Invoices
```
┌──────────────────────────┐
│  INVOICE HISTORY         │
│                          │
│   ⟳ Loading invoices...  │
│                          │
└──────────────────────────┘
```

---

## Accessibility Features

- ✅ Form labels associated with inputs
- ✅ Required fields marked with *
- ✅ Error messages linked to inputs
- ✅ Buttons have clear text
- ✅ Icons have fallback text
- ✅ Color not the only indicator
- ✅ Sufficient color contrast
- ✅ Keyboard navigation supported
- ✅ Loading states announced

---

## Print Stylesheet

When user prints the profile:
```
- Hides navigation
- Hides action buttons
- Shows all form values
- Prints in single column
- Professional formatting
```

---

**This is what your users will experience! 🎨**

Clean, professional, user-friendly interface that works on all devices.
