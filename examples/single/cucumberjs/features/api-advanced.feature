Feature: Advanced Features
  Demonstrates CucumberJS + AiTestingTool tag patterns:
  parameters, suite hierarchy, and ignore

  Background:
    Given the API is available at "https://jsonplaceholder.typicode.com"

  @AUTH-112
  @QaTitle=Fetch_user_and_their_posts_relationship
  @QaFields={"severity":"normal","priority":"high","layer":"api"}
  @QaSuite=API\tAdvanced\tRelationships
  @QaParameters={"testScope":"user_posts_relationship"}
  Scenario: AUTH-112 Fetch user and their posts
    When I send a GET request to "/users/1"
    Then the response status should be 200
    And the response "name" should be "Leanne Graham"
    When I send a GET request to "/posts?userId=1"
    Then the response status should be 200
    And the response should contain 10 items

  @AUTH-113
  @QaFields={"severity":"normal","layer":"api"}
  @QaSuite=API\tAdvanced\tData_Validation
  Scenario: AUTH-113 Suite hierarchy demonstration
    When I send a GET request to "/todos/1"
    Then the response status should be 200
    And the response should have a "completed" field

  @AUTH-114
  @QaFields={"severity":"normal","layer":"api"}
  @QaSuite=API\tAdvanced\tParameterized
  @QaParameters={"testType":"outline_demo"}
  Scenario Outline: AUTH-114 Parameters with Scenario Outline
    When I send a GET request to "/comments?postId=<postId>"
    Then the response status should be 200
    And the response should contain 5 items

    Examples:
      | postId |
      | 1      |
      | 2      |

  @QaIgnore
  Scenario: Ignored scenario - not reported to AiTestingTool
    When I send a GET request to "/users/1"
    Then the response status should be 200
