/// <reference types="cypress" />

describe('E2E-002 - Création d’une tâche', () => {

  it('should create a new task successfully', () => {

    const email = 'Noha@test.com';
    const password = 'Noha1234';

    const taskTitle = 'test de creation de tache avec cypress';
    const description =
      'Utilisation de Cypress pour automatiser la creation des etapes de test';
    const priority = 'HIGH';

    // =========================
    // CONNEXION
    // =========================

    cy.visit('http://localhost:4200/login');

    cy.get('input[name="email"]')
      .type(email);

    cy.get('input[name="password"]')
      .type(password);

    cy.get('button[type="submit"]')
      .click();

    cy.url()
      .should('include', '/projects');


    // =========================
    // OUVRIR LE PROJET
    // =========================

    cy.contains('My Projects')
      .should('be.visible');

    cy.get('div.project-info h3')
      .first()
      .click();


    // =========================
    // CRÉER UNE TÂCHE
    // =========================

    cy.get('input[placeholder="Task title"]')
      .type(taskTitle);

    cy.get('input[placeholder="Description (optional)"]')
      .type(description);

    cy.get('select')
      .select(priority);

    cy.get('div.new-task-form button')
      .click();


    // =========================
    // VÉRIFICATIONS
    // =========================

    cy.get('#cdk-drop-list-0')
      .should('contain.text', taskTitle);

    cy.get('#cdk-drop-list-0')
      .should('contain.text', description);

    cy.get('#cdk-drop-list-0 span.priority-high')
      .should('contain.text', 'HIGH');

    cy.get('input[placeholder="Task title"]')
      .should('have.value', '');

    cy.get('input[placeholder="Description (optional)"]')
      .should('have.value', '');
  });

});