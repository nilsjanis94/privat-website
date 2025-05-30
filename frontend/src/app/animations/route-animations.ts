import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  // Login zu Dashboard - Slide Up Animation
  transition('login => dashboard', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('600ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateY(-100%)', 
            opacity: 0,
            filter: 'blur(4px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        style({ 
          transform: 'translateY(100%)', 
          opacity: 0,
          filter: 'blur(4px)'
        }),
        animate('600ms 200ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateY(0%)', 
            opacity: 1,
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ]),

  // Register zu Dashboard - ähnlicher Effekt
  transition('register => dashboard', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('600ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateY(-100%)', 
            opacity: 0,
            filter: 'blur(4px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        style({ 
          transform: 'translateY(100%)', 
          opacity: 0,
          filter: 'blur(4px)'
        }),
        animate('600ms 200ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateY(0%)', 
            opacity: 1,
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ]),

  // Dashboard zu Analytics - Slide Right mit Scale
  transition('dashboard => analytics', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('500ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(-30%) scale(0.95)', 
            opacity: 0,
            filter: 'blur(2px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        style({ 
          transform: 'translateX(100%) scale(0.9)', 
          opacity: 0,
          filter: 'blur(2px)'
        }),
        animate('500ms 150ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(0%) scale(1)', 
            opacity: 1,
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ]),

  // Analytics zu Dashboard - Slide Left mit Scale
  transition('analytics => dashboard', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('500ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(100%) scale(0.95)', 
            opacity: 0,
            filter: 'blur(2px)'
          })
        )
      ], { optional: true }),
      query(':enter', [
        style({ 
          transform: 'translateX(-30%) scale(0.9)', 
          opacity: 0,
          filter: 'blur(2px)'
        }),
        animate('500ms 150ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(0%) scale(1)', 
            opacity: 1,
            filter: 'blur(0px)'
          })
        )
      ], { optional: true })
    ])
  ]),

  // Inventory zu Analytics - Cross Slide
  transition('inventory => analytics', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('450ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(-50%)', 
            opacity: 0
          })
        )
      ], { optional: true }),
      query(':enter', [
        style({ 
          transform: 'translateX(50%)', 
          opacity: 0
        }),
        animate('450ms 100ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(0%)', 
            opacity: 1
          })
        )
      ], { optional: true })
    ])
  ]),

  // Analytics zu Inventory - Cross Slide Reverse
  transition('analytics => inventory', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('450ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(50%)', 
            opacity: 0
          })
        )
      ], { optional: true }),
      query(':enter', [
        style({ 
          transform: 'translateX(-50%)', 
          opacity: 0
        }),
        animate('450ms 100ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(0%)', 
            opacity: 1
          })
        )
      ], { optional: true })
    ])
  ]),

  // Dashboard zu anderen Seiten - schnellere Transition
  transition('dashboard => *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(-50%)', 
            opacity: 0
          })
        )
      ], { optional: true }),
      query(':enter', [
        style({ 
          transform: 'translateX(50%)', 
          opacity: 0
        }),
        animate('400ms 100ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(0%)', 
            opacity: 1
          })
        )
      ], { optional: true })
    ])
  ]),

  // Andere Seiten zu Dashboard - rückwärts
  transition('* => dashboard', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(50%)', 
            opacity: 0
          })
        )
      ], { optional: true }),
      query(':enter', [
        style({ 
          transform: 'translateX(-50%)', 
          opacity: 0
        }),
        animate('400ms 100ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ 
            transform: 'translateX(0%)', 
            opacity: 1
          })
        )
      ], { optional: true })
    ])
  ]),

  // Standard Fade-Animation für andere Übergänge
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-in', 
          style({ opacity: 0 })
        )
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', 
          style({ opacity: 1 })
        )
      ], { optional: true })
    ])
  ])
]);

// Helper function um Route-State zu bestimmen
export function getRouteAnimation(outlet: any) {
  return outlet?.activatedRouteData?.['animation'] || '';
} 