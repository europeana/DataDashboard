import { Component } from '@angular/core';

/** Dataspace logo for navbar-start (rendered after the menu button via navbarStartComponents). */
@Component({
  selector: 'app-navbar-logo',
  standalone: true,
  template: `
    <a href="/" class="ml-2 flex items-center shrink-0" aria-label="Home">
      <img src="dataspace-logo.svg" alt="Home" class="h-16 w-auto" />
    </a>
  `,
})
export class NavbarLogoComponent {}
