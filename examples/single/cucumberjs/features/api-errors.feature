Feature: Error Handling
  As an API consumer
  I want the API to handle errors gracefully
  So that error responses are predictable

  Background:
    Given the API is available at "https://jsonplaceholder.typicode.com"

  @AUTH-108
  @QaFields={"severity":"normal","layer":"api"}
  @QaSuite=API\tErrors\tNot_Found
  Scenario: AUTH-108 Non-existent user returns 404
    When I send a GET request to "/users/9999"
    Then the response status should be 404
    And the response should be an empty object

  @AUTH-109
  @QaFields={"severity":"normal","layer":"api"}
  @QaSuite=API\tErrors\tNot_Found
  Scenario: AUTH-109 Non-existent post returns 404
    When I send a GET request to "/posts/99999"
    Then the response status should be 404
    And the response should be an empty object

  @AUTH-110
  @QaFields={"severity":"minor","layer":"api"}
  @QaSuite=API\tErrors\tInvalid_Endpoint
  Scenario: AUTH-110 Invalid endpoint returns 404
    When I send a GET request to "/invalid-endpoint"
    Then the response status should be 404

  @AUTH-111
  @QaFields={"severity":"normal","layer":"api"}
  @QaSuite=API\tErrors\tValidation
  Scenario: AUTH-111 POST with empty body is handled gracefully
    When I send a POST request to "/posts" with body:
      """
      {}
      """
    Then the response status should be 201
    And the response should have an "id" field
