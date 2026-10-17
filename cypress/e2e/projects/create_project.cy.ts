describe('E2E-003 - Création de projet', () => {

  const email = 'Noha@test.com';
  const password = 'Noha1234';
  const fullName = 'Noha Test';

  before(() => {
    // Crée le compte s'il n'existe pas déjà (idempotent)
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/auth/register',
      failOnStatusCode: false,
      body: { fullName, email, password },
    });
  });

  beforeEach(() => {
    // Connexion via l'UI (on attend la réponse du login avant de continuer)
    cy.intercept('POST', '**/api/auth/login').as('login');

    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.wait('@login').its('response.statusCode').should('eq', 200);
    cy.url().should('include', '/projects');
  });

  it('should create a new project and display it in the list', () => {
    // Titre unique pour éviter les doublons entre exécutions
    const title = `Integration de studio IA ${Date.now()}`;
    const description =
      'Creation de test a partir de test manuel de produit avec l aide de studio AI';

    cy.intercept('POST', '**/api/projects').as('createProject');

    // Ouverture de la modale
    cy.contains('button.primary-btn', '+ New Project').click();
    cy.get('div.modal').should('be.visible');
    cy.contains('h2', 'New Project').should('be.visible');

    // Saisie du formulaire
    cy.get('div.modal input[type="text"]').type(title);
    cy.get('div.modal textarea').type(description);

    // Dates (input type="date" => format yyyy-mm-dd)
    cy.get('div.modal div.date-row input').first().type('2026-10-10');
    cy.get('div.modal div.date-row input').last().type('2026-10-30');

    // Validation
    cy.get('div.modal-actions button.primary-btn')
      .contains('Create')
      .click();

    // Vérification API
    cy.wait('@createProject').then((interception) => {
      expect(interception.response, 'La réponse HTTP doit exister').to.exist;
      expect(interception.response!.statusCode).to.be.oneOf([200, 201]);
      expect(interception.response!.body).to.have.property('name', title);
    });

    // La modale se ferme
    cy.get('div.modal').should('not.exist');

    // Le projet apparaît dans la liste (recherche par contenu, pas par position)
    cy.contains('h3', title).should('be.visible');
    cy.contains('h3', title)
      .closest('div')
      .should('contain.text', description);
  });

  it('should not create a project without a name', () => {
    cy.contains('button.primary-btn', '+ New Project').click();
    cy.get('div.modal').should('be.visible');

    // On laisse le nom vide et on tente de valider
    cy.get('div.modal-actions button.primary-btn').contains('Create').click();

    // La modale reste ouverte (validation front)
    cy.get('div.modal').should('be.visible');
  });
});