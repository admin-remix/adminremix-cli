import { gql, GraphQLClient } from 'graphql-request';

interface MemberOfDepartmentInput {
  isPrimary: boolean;
  departmentId: number;
}
type ExistingUsers = Record<string, {
  id: number;
  memberOfDepartments?: MemberOfDepartmentInput[]
}>;

export async function getUsersByEmails(client: GraphQLClient, emailsToCheck: string[]): Promise<ExistingUsers> {
  const data = await client.request<{
    searchUsers?: {
      node: {
        id: number;
        email: string;
        memberOfDepartments?: {
          isPrimary?: boolean;
          department?: {
            id: number;
          }
        }[]
      }[]
    }
  }>(gql`query($pagination: Pagination!, $searchBy: SearchBy!) {
    searchUsers(pagination: $pagination, searchBy: $searchBy) {
      node {
        id
        email
        memberOfDepartments {
          isPrimary
          department {
            id
          }
        }
      }
    }
  }`, {
    pagination: {},
    searchBy: {
      searchBy: [
        {
          column: "email",
          searchMode: "AND",
          searchType: "IN",
          valueType: "ARRAY",
          value: JSON.stringify(emailsToCheck)
        }
      ]
    }
  });
  if (!data?.searchUsers?.node) {
    throw new Error("Cannot connect to server.");
  }
  const existingUsers = data.searchUsers.node.reduce((acc, cur) => {
    acc[cur.email] = {
      id: cur.id,
      memberOfDepartments: cur.memberOfDepartments?.reduce((acc2, cur2) => {
        if (cur2.department) {
          acc2.push({
            isPrimary: cur2.isPrimary || false,
            departmentId: cur2.department.id
          });
        }
        return acc2;
      }, [] as MemberOfDepartmentInput[]) || []
    };
    return acc;
  }, {} as ExistingUsers);
  return existingUsers;
}