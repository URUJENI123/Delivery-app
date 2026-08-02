'use client';

export function createCourierMarkerElement(photo?: string | null, initials?: string): HTMLDivElement {
  const outer = document.createElement('div');
  outer.className = 'relative flex flex-col items-center cursor-pointer';
  outer.style.cssText = 'width:52px;height:62px';

  const circle = document.createElement('div');
  circle.className = 'rounded-full overflow-hidden border-[3px] border-red-600 flex items-center justify-center';
  circle.style.cssText = 'width:48px;height:48px;background:#892020';

  if (photo) {
    const img = document.createElement('img');
    img.src = photo;
    img.alt = 'Courier';
    img.className = 'w-full h-full object-cover';
    circle.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className = 'font-display text-lg font-bold text-white';
    span.textContent = initials || 'C';
    circle.appendChild(span);
  }

  outer.appendChild(circle);

  const pointer = document.createElement('div');
  pointer.style.cssText =
    'width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid #892020;position:absolute;bottom:0;left:50%;transform:translateX(-50%)';
  outer.appendChild(pointer);

  const ring = document.createElement('div');
  ring.className = 'absolute inset-0 rounded-full border-2 border-red-600/30 animate-marker-pulse';
  ring.style.cssText = 'width:48px;height:48px;';
  circle.prepend(ring);

  return outer;
}

export function createPickupMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'flex flex-col items-center';
  const circle = document.createElement('div');
  circle.className = 'w-9 h-9 rounded-full bg-success flex items-center justify-center';
  circle.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2"/></svg>';
  el.appendChild(circle);
  const label = document.createElement('span');
  label.className = 'text-[11px] font-body text-gray-600 mt-0.5';
  label.textContent = 'P';
  el.appendChild(label);
  return el;
}

export function createDropoffMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'flex flex-col items-center';
  const circle = document.createElement('div');
  circle.className = 'w-9 h-9 rounded-full bg-red-600 flex items-center justify-center';
  circle.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 9v11a2 2 0 01-2 2H6a2 2 0 01-2-2V9"/><path d="M22 5H2v4h20V5zM12 17v-5"/></svg>';
  el.appendChild(circle);
  const label = document.createElement('span');
  label.className = 'text-[11px] font-body text-gray-600 mt-0.5';
  label.textContent = 'D';
  el.appendChild(label);
  return el;
}
